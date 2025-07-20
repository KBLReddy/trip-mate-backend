// src/tours/tours.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTourDto } from './dto/create-tour.dto';
import { UpdateTourDto } from './dto/update-tour.dto';
import { TourQueryDto } from './dto/tour-query.dto';
import { TourStatisticsDto } from './dto/tour-statistics.dto';
import { PaginatedToursDto } from './dto/paginated-tours.dto';
import { TourResponseDto } from './dto/tour-response.dto';
import { Prisma, Role } from '@prisma/client';

@Injectable()
export class ToursService {
  constructor(private prisma: PrismaService) {}

  async create(createTourDto: CreateTourDto, userId: string): Promise<TourResponseDto> {
    const tour = await this.prisma.tour.create({
      data: {
        ...createTourDto,
        price: new Prisma.Decimal(createTourDto.price),
        startDate: new Date(createTourDto.startDate),
        endDate: new Date(createTourDto.endDate),
      },
      include: {
        guide: true,
      },
    });

    return new TourResponseDto(tour);
  }

  async findAll(query: TourQueryDto): Promise<PaginatedToursDto> {
    const {
      search,
      category,
      location,
      minPrice,
      maxPrice,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    // Build where clause
    const where: Prisma.TourWhereInput = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = { equals: category, mode: 'insensitive' };
    }

    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) {
        where.price.gte = new Prisma.Decimal(minPrice);
      }
      // src/tours/tours.service.ts (continued)
      if (maxPrice !== undefined) {
        where.price.lte = new Prisma.Decimal(maxPrice);
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count
    const total = await this.prisma.tour.count({ where });

    // Get tours
    const tours = await this.prisma.tour.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        guide: true,
      },
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      data: tours.map((tour) => new TourResponseDto(tour)),
      total,
      page,
      limit,
      totalPages,
      hasNext,
      hasPrev,
    };
  }

  async findOne(id: string): Promise<TourResponseDto> {
    const tour = await this.prisma.tour.findUnique({
      where: { id },
      include: {
        guide: true,
        bookings: {
          where: {
            status: 'CONFIRMED',
          },
        },
      },
    });

    if (!tour) {
      throw new NotFoundException(`Tour with ID ${id} not found`);
    }

    return new TourResponseDto(tour);
  }

  async update(
    id: string,
    updateTourDto: UpdateTourDto,
    userId: string,
    userRole: Role,
  ): Promise<TourResponseDto> {
    // Check if tour exists
    const existingTour = await this.prisma.tour.findUnique({
      where: { id },
    });

    if (!existingTour) {
      throw new NotFoundException(`Tour with ID ${id} not found`);
    }

    // Check permissions (only admin or tour guide can update)
    if (userRole !== Role.ADMIN && existingTour.guideId !== userId) {
      throw new ForbiddenException('You do not have permission to update this tour');
    }

    // Prepare update data
    const updateData: any = { ...updateTourDto };
    if (updateTourDto.price !== undefined) {
      updateData.price = new Prisma.Decimal(updateTourDto.price);
    }
    if (updateTourDto.startDate !== undefined) {
      updateData.startDate = new Date(updateTourDto.startDate);
    }
    if (updateTourDto.endDate !== undefined) {
      updateData.endDate = new Date(updateTourDto.endDate);
    }

    const updatedTour = await this.prisma.tour.update({
      where: { id },
      data: updateData,
      include: {
        guide: true,
      },
    });

    return new TourResponseDto(updatedTour);
  }

  async remove(id: string, userId: string, userRole: Role): Promise<void> {
    // Check if tour exists
    const tour = await this.prisma.tour.findUnique({
      where: { id },
      include: {
        bookings: {
          where: {
            status: {
              in: ['CONFIRMED', 'PENDING'],
            },
          },
        },
      },
    });

    if (!tour) {
      throw new NotFoundException(`Tour with ID ${id} not found`);
    }

    // Check permissions
    if (userRole !== Role.ADMIN && tour.guideId !== userId) {
      throw new ForbiddenException('You do not have permission to delete this tour');
    }

    // Check if tour has active bookings
    if (tour.bookings.length > 0) {
      throw new ForbiddenException('Cannot delete tour with active bookings');
    }

    await this.prisma.tour.delete({
      where: { id },
    });
  }

  async getCategories(): Promise<string[]> {
    const categories = await this.prisma.tour.findMany({
      select: {
        category: true,
      },
      distinct: ['category'],
      orderBy: {
        category: 'asc',
      },
    });

    return categories.map((c) => c.category);
  }
  async getSearchSuggestions(query: string): Promise<{ locations: string[]; titles: string[] }> {
  if (!query || query.length < 2) {
    return { locations: [], titles: [] };
  }

  const [locations, titles] = await Promise.all([
    // Get unique locations
    this.prisma.tour.findMany({
      where: {
        location: {
          contains: query,
          mode: 'insensitive',
        },
      },
      select: {
        location: true,
      },
      distinct: ['location'],
      take: 5,
    }),
    // Get tour titles
    this.prisma.tour.findMany({
      where: {
        title: {
          contains: query,
          mode: 'insensitive',
        },
      },
      select: {
        title: true,
      },
      take: 5,
    }),
  ]);

  return {
    locations: locations.map((l) => l.location),
    titles: titles.map((t) => t.title),
  };
}

  // Add this method to tours.service.ts
  async getStatistics(): Promise<TourStatisticsDto> {
  const now = new Date();

  // Get total tours
  const totalTours = await this.prisma.tour.count();

  // Get categories count
  const categories = await this.prisma.tour.groupBy({
    by: ['category'],
    _count: true,
  });

  // Get average price
  const priceAggregate = await this.prisma.tour.aggregate({
    _avg: {
      price: true,
    },
  });

  // Get tour counts by status
  const [upcomingTours, ongoingTours, completedTours] = await Promise.all([
    this.prisma.tour.count({
      where: {
        startDate: {
          gt: now,
        },
      },
    }),
    this.prisma.tour.count({
      where: {
        startDate: {
          lte: now,
        },
        endDate: {
          gte: now,
        },
      },
    }),
    this.prisma.tour.count({
      where: {
        endDate: {
          lt: now,
        },
      },
    }),
  ]);

  // Create category map
  const toursByCategory = categories.reduce((acc, cat) => {
    acc[cat.category] = cat._count;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalTours,
    totalCategories: categories.length,
    averagePrice: Number(priceAggregate._avg.price) || 0,
    upcomingTours,
    ongoingTours,
    completedTours,
    toursByCategory,
  };
 }

  async getAvailableCapacity(tourId: string): Promise<number> {
    const tour = await this.prisma.tour.findUnique({
      where: { id: tourId },
      include: {
        bookings: {
          where: {
            status: 'CONFIRMED',
          },
        },
      },
    });

    if (!tour) {
      throw new NotFoundException(`Tour with ID ${tourId} not found`);
    }

    const bookedCapacity = tour.bookings.length;
    return tour.capacity - bookedCapacity;
  }
  
}