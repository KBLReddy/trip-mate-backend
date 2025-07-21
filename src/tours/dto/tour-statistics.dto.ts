// src/tours/dto/tour-statistics.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class TourStatisticsDto {
  @ApiProperty()
  totalTours: number;

  @ApiProperty()
  totalCategories: number;

  @ApiProperty()
  averagePrice: number;

  @ApiProperty()
  upcomingTours: number;

  @ApiProperty()
  ongoingTours: number;

  @ApiProperty()
  completedTours: number;

  @ApiProperty()
  toursByCategory: Record<string, number>;
}
