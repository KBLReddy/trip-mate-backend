// src/auth/dto/verify-otp.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({ 
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'User ID received from registration response' 
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ 
    example: '123456',
    description: '6-digit OTP code sent to email' 
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  otp: string;
}