// src/users/users.service.ts
import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(email: string, password: string, name: string): Promise<User> {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    return this.prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        name,
        isVerified: true, // Keep existing users verified by default
      },
    });
  }

  /**
   * Create an unverified user with OTP (for registration flow)
   */
  async createUnverified(data: {
    email: string;
    password: string;
    name: string;
    otp: string;
    otpExpiresAt: Date;
  }): Promise<User> {
    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create unverified user with OTP
    return this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: hashedPassword,
        name: data.name,
        isVerified: false, // Not verified yet
        otp: data.otp,
        otpExpiresAt: data.otpExpiresAt,
        otpAttempts: 0,
        otpLastSent: new Date(),
      },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.findByEmail(email);
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }
}
