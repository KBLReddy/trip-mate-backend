// src/bookings/dto/create-booking.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  @IsNotEmpty()
  tourId: string;

  @ApiProperty({ example: 'Special dietary requirements...', required: false })
  @IsString()
  @IsOptional()
  specialRequests?: string;
}