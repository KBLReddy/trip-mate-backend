// src/auth/dto/resend-otp.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ResendOtpDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'User ID received from registration response',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;
}
