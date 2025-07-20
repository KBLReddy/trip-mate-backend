// src/tours/dto/paginated-tours.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { TourResponseDto } from './tour-response.dto';

export class PaginatedToursDto {
  @ApiProperty({ type: [TourResponseDto] })
  data: TourResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty()
  hasNext: boolean;

  @ApiProperty()
  hasPrev: boolean;
}