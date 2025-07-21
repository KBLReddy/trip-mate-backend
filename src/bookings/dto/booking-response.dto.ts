// src/bookings/dto/booking-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { BookingStatus, PaymentStatus } from '@prisma/client';
import { TourResponseDto } from '../../tours/dto/tour-response.dto';
import { UserResponseDto } from '../../users/dto/user-response.dto';

export class BookingResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  tourId: string;

  @ApiProperty()
  bookingDate: Date;

  @ApiProperty({ enum: BookingStatus })
  status: BookingStatus;

  @ApiProperty({ enum: PaymentStatus })
  paymentStatus: PaymentStatus;

  @ApiProperty()
  amount: number;

  @ApiProperty({ required: false })
  specialRequests?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ required: false })
  tour?: TourResponseDto;

  @ApiProperty({ required: false })
  user?: UserResponseDto;
}
