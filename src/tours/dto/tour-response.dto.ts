// src/tours/dto/tour-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Tour, User } from '@prisma/client';

export class TourGuideDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;
}

export class TourResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  location: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiProperty()
  capacity: number;

  @ApiProperty({ required: false })
  imageUrl?: string | null;

  @ApiProperty()
  category: string;

  @ApiProperty({ required: false })
  guide?: TourGuideDto | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(tour: Tour & { guide?: User | null }) {
    this.id = tour.id;
    this.title = tour.title;
    this.description = tour.description;
    this.location = tour.location;
    this.price = Number(tour.price);
    this.startDate = tour.startDate;
    this.endDate = tour.endDate;
    this.capacity = tour.capacity;
    this.imageUrl = tour.imageUrl;
    this.category = tour.category;
    this.createdAt = tour.createdAt;
    this.updatedAt = tour.updatedAt;

    if (tour.guide) {
      this.guide = {
        id: tour.guide.id,
        name: tour.guide.name,
        email: tour.guide.email,
      };
    } else {
      this.guide = null;
    }
  }
}
