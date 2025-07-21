// src/tours/dto/create-tour.dto.ts
import { IsEndDateAfterStartDate } from '../../common/validators/date-range.validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsDateString,
  IsOptional,
  Min,
  IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTourDto {
  @ApiProperty({ example: 'Amazing Bali Adventure' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: 'Experience the beauty of Bali with our 7-day adventure tour',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'Bali, Indonesia' })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiProperty({ example: 1299.99 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Type(() => Number)
  price: number;

  @ApiProperty({ example: '2024-06-01T00:00:00Z' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2024-06-07T00:00:00Z' })
  @IsDateString()
  @IsEndDateAfterStartDate({ message: 'End date must be after start date' })
  endDate: string;

  @ApiProperty({ example: 20 })
  @IsNumber()
  @IsPositive()
  @Min(1)
  @Type(() => Number)
  capacity: number;

  @ApiProperty({
    example: 'https://example.com/tour-image.jpg',
    required: false,
  })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({ example: 'adventure' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  guideId?: string;
}
