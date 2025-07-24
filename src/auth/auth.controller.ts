// src/auth/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtPayload } from '../common/types/jwt-payload.type';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered. OTP sent to email.',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Verification code sent to your email' },
        userId: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
        email: { type: 'string', example: 'john.doe@example.com' },
        expiresIn: { type: 'string', example: '10 minutes' },
      },
    },
  })
  @ApiResponse({ status: 409, description: 'User already exists' })
  @ApiResponse({ status: 400, description: 'Failed to send verification email' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP and complete registration' })
  @ApiResponse({
    status: 200,
    description: 'OTP verified successfully. User is now logged in.',
    type: AuthResponseDto,
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid or expired OTP',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Invalid verification code. 4 attempts remaining.' },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto): Promise<AuthResponseDto> {
    return this.authService.verifyOTP(verifyOtpDto.userId, verifyOtpDto.otp);
  }

  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend OTP verification code' })
  @ApiResponse({
    status: 200,
    description: 'OTP resent successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'New verification code sent to your email' },
        expiresIn: { type: 'string', example: '10 minutes' },
      },
    },
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid request or rate limit exceeded',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Please wait 45 seconds before requesting a new code' },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  async resendOtp(@Body() resendOtpDto: ResendOtpDto) {
    return this.authService.resendOTP(resendOtpDto.userId);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged in',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ 
    status: 403, 
    description: 'Email not verified',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 403 },
        message: { type: 'string', example: 'Email not verified' },
        error: { type: 'string', example: 'EMAIL_NOT_VERIFIED' },
        userId: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
      },
    },
  })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Token successfully refreshed',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Invalid refresh token' })
  async refreshTokens(
    @CurrentUser() user: JwtPayload,
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<AuthResponseDto> {
    return this.authService.refreshTokens(
      user.sub,
      refreshTokenDto.refreshToken,
    );
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'User successfully logged out' })
  async logout(
    @CurrentUser() user: JwtPayload,
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<void> {
    return this.authService.logout(user.sub, refreshTokenDto.refreshToken);
  }
}