// src/bookings/dto/booking-statistics.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class BookingStatisticsDto {
  @ApiProperty()
  totalBookings: number;

  @ApiProperty()
  confirmedBookings: number;

  @ApiProperty()
  pendingBookings: number;

  @ApiProperty()
  cancelledBookings: number;

  @ApiProperty()
  totalRevenue: number;

  @ApiProperty()
  pendingPayments: number;

  @ApiProperty()
  completedPayments: number;
}
