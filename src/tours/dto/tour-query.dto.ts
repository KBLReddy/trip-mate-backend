// src/tours/dto/tour-query.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class TourQueryDto {
  @ApiProperty({ required: false, description: 'Search by title or location' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({ required: false, description: 'Filter by category' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ required: false, description: 'Filter by location' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ required: false, description: 'Minimum price' })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  @Min(0)
  minPrice?: number;

  @ApiProperty({ required: false, description: 'Maximum price' })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  @Min(0)
  maxPrice?: number;

  @ApiProperty({ required: false, default: 1, description: 'Page number' })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 10, description: 'Items per page' })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  @Min(1)
  limit?: number = 10;

  @ApiProperty({
    required: false,
    enum: ['price', 'startDate', 'createdAt'],
    default: 'createdAt',
  })
  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiProperty({ required: false, enum: SortOrder, default: SortOrder.DESC })
  @IsEnum(SortOrder)
  @IsOptional()
  sortOrder?: SortOrder = SortOrder.DESC;
}
