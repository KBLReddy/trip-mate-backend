// src/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtPayload } from '../common/types/jwt-payload.type';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
    private mailService: MailService, // Add mail service
  ) {}

  /**
   * Register a new user with OTP verification
   */
  async register(registerDto: RegisterDto) {
    const { email, password, name } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // If user exists but not verified, allow re-registration
      if (!existingUser.isVerified) {
        // Delete the unverified user to allow re-registration
        await this.prisma.user.delete({
          where: { id: existingUser.id },
        });
      } else {
        throw new ConflictException('User already exists');
      }
    }

    // Generate OTP
    const otp = this.generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user with unverified status
    const user = await this.usersService.createUnverified({
      email,
      password,
      name,
      otp,
      otpExpiresAt,
    });

    // Send OTP email
    try {
      await this.mailService.sendOTPEmail(email, otp, name);
    } catch (error) {
      // If email fails, delete the user
      await this.prisma.user.delete({ where: { id: user.id } });
      throw new BadRequestException('Failed to send verification email. Please try again.');
    }

    // Return user info without tokens (not verified yet)
    return {
      message: 'Verification code sent to your email',
      userId: user.id,
      email: user.email,
      expiresIn: '10 minutes',
    };
  }

  /**
   * Verify OTP and complete registration
   */
  async verifyOTP(userId: string, otp: string): Promise<AuthResponseDto> {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('Invalid verification request');
    }

    // Check if already verified
    if (user.isVerified) {
      throw new BadRequestException('Email already verified');
    }

    // Check OTP attempts
    if (user.otpAttempts >= 5) {
      throw new BadRequestException('Too many failed attempts. Please request a new code.');
    }

    // Check OTP expiry
    if (!user.otpExpiresAt || new Date() > user.otpExpiresAt) {
      throw new BadRequestException('Verification code expired. Please request a new one.');
    }

    // Verify OTP
    if (user.otp !== otp) {
      // Increment attempts
      await this.prisma.user.update({
        where: { id: userId },
        data: { otpAttempts: user.otpAttempts + 1 },
      });
      
      const remainingAttempts = 5 - (user.otpAttempts + 1);
      throw new BadRequestException(
        `Invalid verification code. ${remainingAttempts} attempts remaining.`
      );
    }

    // Mark user as verified
    const verifiedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        isVerified: true,
        otp: null,
        otpExpiresAt: null,
        otpAttempts: 0,
      },
    });

    // Send welcome email (don't wait for it)
    this.mailService.sendWelcomeEmail(user.email, user.name).catch(error => {
      // Log error but don't fail the request
      console.error('Failed to send welcome email:', error);
    });

    // Generate tokens
    const tokens = await this.generateTokens({
      sub: verifiedUser.id,
      email: verifiedUser.email,
      role: verifiedUser.role,
    });

    // Save refresh token
    await this.saveRefreshToken(verifiedUser.id, tokens.refreshToken);

    return {
      ...tokens,
      user: {
        id: verifiedUser.id,
        email: verifiedUser.email,
        name: verifiedUser.name,
        role: verifiedUser.role,
      },
    };
  }

  /**
   * Resend OTP
   */
  async resendOTP(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('Invalid request');
    }

    if (user.isVerified) {
      throw new BadRequestException('Email already verified');
    }

    // Rate limiting - check last sent time
    if (user.otpLastSent) {
      const timeSinceLastSent = Date.now() - new Date(user.otpLastSent).getTime();
      const waitTime = 60 * 1000; // 1 minute
      
      if (timeSinceLastSent < waitTime) {
        const remainingSeconds = Math.ceil((waitTime - timeSinceLastSent) / 1000);
        throw new BadRequestException(
          `Please wait ${remainingSeconds} seconds before requesting a new code`
        );
      }
    }

    // Generate new OTP
    const otp = this.generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Update user with new OTP
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        otp,
        otpExpiresAt,
        otpAttempts: 0,
        otpLastSent: new Date(),
      },
    });

    // Send OTP email
    try {
      await this.mailService.sendOTPEmail(user.email, otp, user.name);
    } catch (error) {
      throw new BadRequestException('Failed to send verification email. Please try again.');
    }

    return {
      message: 'New verification code sent to your email',
      expiresIn: '10 minutes',
    };
  }

  /**
   * Modified login to check verification status
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Validate user
    const user = await this.usersService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is verified
    if (!user.isVerified) {
      // Generate new OTP if expired
      if (!user.otpExpiresAt || new Date() > user.otpExpiresAt) {
        const otp = this.generateOTP();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
        
        await this.prisma.user.update({
          where: { id: user.id },
          data: { otp, otpExpiresAt, otpAttempts: 0 },
        });
        
        // Send OTP
        await this.mailService.sendOTPEmail(email, otp, user.name);
      }
      
      throw new UnauthorizedException({
        statusCode: 403,
        message: 'Email not verified',
        error: 'EMAIL_NOT_VERIFIED',
        userId: user.id,
      });
    }

    // Generate tokens
    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    // Save refresh token
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  /**
   * Generate 6-digit OTP
   */
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Keep your existing methods below unchanged
  async logout(userId: string, refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: {
        userId,
        token: refreshToken,
      },
    });
  }

  async refreshTokens(
    userId: string,
    refreshToken: string,
  ): Promise<AuthResponseDto> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new ForbiddenException('Access Denied');
    }

    // Verify refresh token exists in database
    const storedToken = await this.prisma.refreshToken.findFirst({
      where: {
        userId,
        token: refreshToken,
      },
    });

    if (!storedToken) {
      throw new ForbiddenException('Access Denied');
    }

    // Check if token is expired
    if (storedToken.expiresAt < new Date()) {
      await this.prisma.refreshToken.delete({
        where: { id: storedToken.id },
      });
      throw new ForbiddenException('Refresh token expired');
    }

    // Generate new tokens
    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    // Delete old refresh token
    await this.prisma.refreshToken.delete({
      where: { id: storedToken.id },
    });

    // Save new refresh token
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  private async generateTokens(payload: JwtPayload) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async saveRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt,
      },
    });
  }
}