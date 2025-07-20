// src/bookings/bookings.service.ts
import { 
  Injectable, 
  NotFoundException, 
  BadRequestException, 
  ForbiddenException 
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { BookingQueryDto } from './dto/booking-query.dto';
import { BookingStatisticsDto } from './dto/booking-statistics.dto';
import { BookingResponseDto } from './dto/booking-response.dto';
import { Prisma, BookingStatus, PaymentStatus, Role } from '@prisma/client';
import { ToursService } from '../tours/tours.service';

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    private toursService: ToursService,
  ) {}

  async create(createBookingDto: CreateBookingDto, userId: string) {
    const { tourId, specialRequests } = createBookingDto;

    // Check if tour exists and get details
    const tour = await this.prisma.tour.findUnique({
      where: { id: tourId },
    });

    if (!tour) {
      throw new NotFoundException('Tour not found');
    }

    // Check if tour hasn't started yet
    if (tour.startDate <= new Date()) {
      throw new BadRequestException('Cannot book a tour that has already started');
    }

    // Check availability
    const availableCapacity = await this.toursService.getAvailableCapacity(tourId);
    if (availableCapacity <= 0) {
      throw new BadRequestException('Tour is fully booked');
    }

    // Check if user already has a booking for this tour
    const existingBooking = await this.prisma.booking.findFirst({
      where: {
        userId,
        tourId,
        status: {
          not: BookingStatus.CANCELLED,
        },
      },
    });

    if (existingBooking) {
      throw new BadRequestException('You already have a booking for this tour');
    }

    // Create booking
    const booking = await this.prisma.booking.create({
      data: {
        userId,
        tourId,
        amount: tour.price,
        status: BookingStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        specialRequests,
      },
      include: {
        tour: {
          include: {
            guide: true,
          },
        },
        user: true,
      },
    });

    // Create notification for the booking
    await this.prisma.notification.create({
      data: {
        userId,
        type: 'BOOKING_CONFIRMED',
        title: 'Booking Created',
        content: `Your booking for ${tour.title} has been created. Please complete the payment.`,
        relatedId: booking.id,
      },
    });

    return this.formatBookingResponse(booking);
  }

  async findAll(userId: string, userRole: Role, query: BookingQueryDto) {
    const { status, paymentStatus, fromDate, toDate, page = 1, limit = 10 } = query;

    const where: Prisma.BookingWhereInput = {};

    // If not admin, only show user's own bookings
    if (userRole !== Role.ADMIN) {
      where.userId = userId;
    }

    if (status) {
      where.status = status;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    if (fromDate || toDate) {
      where.bookingDate = {};
      if (fromDate) {
        where.bookingDate.gte = new Date(fromDate);
      }
      if (toDate) {
        where.bookingDate.lte = new Date(toDate);
      }
    }

    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          bookingDate: 'desc',
        },
        include: {
          tour: {
            include: {
              guide: true,
            },
          },
          user: true,
        },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      data: bookings.map(booking => this.formatBookingResponse(booking)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, userId: string, userRole: Role) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        tour: {
          include: {
            guide: true,
          },
        },
        user: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Check if user has permission to view this booking
    if (userRole !== Role.ADMIN && booking.userId !== userId) {
      throw new ForbiddenException('You do not have permission to view this booking');
    }

    return this.formatBookingResponse(booking);
  }

  async updateStatus(
    id: string,
    updateBookingStatusDto: UpdateBookingStatusDto,
    userId: string,
    userRole: Role,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        tour: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Check permissions
    if (userRole !== Role.ADMIN && booking.userId !== userId) {
      throw new ForbiddenException('You do not have permission to update this booking');
    }

    // Validate status transitions
    if (updateBookingStatusDto.status === BookingStatus.CANCELLED) {
      if (booking.status === BookingStatus.COMPLETED) {
        throw new BadRequestException('Cannot cancel a completed booking');
      }

      // Check if tour has already started
      if (booking.tour.startDate <= new Date()) {
        throw new BadRequestException('Cannot cancel a tour that has already started');
      }
    }

    const updatedBooking = await this.prisma.booking.update({
      where: { id },
      data: updateBookingStatusDto,
      include: {
        tour: {
          include: {
            guide: true,
          },
        },
        user: true,
      },
    });

    // Create notification for status change
    if (updateBookingStatusDto.status === BookingStatus.CANCELLED) {
      await this.prisma.notification.create({
        data: {
          userId: booking.userId,
          type: 'BOOKING_CANCELLED',
          title: 'Booking Cancelled',
          content: `Your booking for ${booking.tour.title} has been cancelled.`,
          relatedId: booking.id,
        },
      });
    }

    return this.formatBookingResponse(updatedBooking);
  }

  async cancel(id: string, userId: string) {
    return this.updateStatus(
      id,
      { 
        status: BookingStatus.CANCELLED,
        paymentStatus: PaymentStatus.REFUNDED,
      },
      userId,
      Role.USER,
    );
  }

  async getMyBookings(userId: string, query: BookingQueryDto) {
    return this.findAll(userId, Role.USER, query);
  }

  async getStatistics(userId: string, userRole: Role): Promise<BookingStatisticsDto> {
    const where: Prisma.BookingWhereInput = {};
    
    // If not admin, only show user's own statistics
    if (userRole !== Role.ADMIN) {
      where.userId = userId;
    }

    const [
      totalBookings,
      statusCounts,
      paymentCounts,
      revenueAggregate,
    ] = await Promise.all([
      this.prisma.booking.count({ where }),
      this.prisma.booking.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      this.prisma.booking.groupBy({
        by: ['paymentStatus'],
        where,
        _count: true,
      }),
      this.prisma.booking.aggregate({
        where: {
          ...where,
          paymentStatus: PaymentStatus.PAID,
        },
        _sum: {
          amount: true,
        },
      }),
    ]);

    // Convert grouped results to counts
    const statusCountMap = statusCounts.reduce((acc, curr) => {
      acc[curr.status] = curr._count;
      return acc;
    }, {} as Record<string, number>);

    const paymentCountMap = paymentCounts.reduce((acc, curr) => {
      acc[curr.paymentStatus] = curr._count;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalBookings,
      confirmedBookings: statusCountMap[BookingStatus.CONFIRMED] || 0,
      pendingBookings: statusCountMap[BookingStatus.PENDING] || 0,
      cancelledBookings: statusCountMap[BookingStatus.CANCELLED] || 0,
      totalRevenue: Number(revenueAggregate._sum.amount) || 0,
      pendingPayments: paymentCountMap[PaymentStatus.PENDING] || 0,
      completedPayments: paymentCountMap[PaymentStatus.PAID] || 0,
    };
  }

  async confirmPayment(bookingId: string, userId: string, userRole: Role) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        tour: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (userRole !== Role.ADMIN) {
      throw new ForbiddenException('Only admin can confirm payments');
    }

    if (booking.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Payment already confirmed');
    }

    const updatedBooking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        paymentStatus: PaymentStatus.PAID,
        status: BookingStatus.CONFIRMED,
      },
      include: {
        tour: {
          include: {
            guide: true,
          },
        },
        user: true,
      },
    });

    // Create payment success notification
    await this.prisma.notification.create({
      data: {
        userId: booking.userId,
        type: 'PAYMENT_SUCCESS',
        title: 'Payment Confirmed',
        content: `Your payment for ${booking.tour.title} has been confirmed.`,
        relatedId: booking.id,
      },
    });

    return this.formatBookingResponse(updatedBooking);
  }

  private formatBookingResponse(booking: any): BookingResponseDto {
    return {
      id: booking.id,
      userId: booking.userId,
      tourId: booking.tourId,
      bookingDate: booking.bookingDate,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      amount: Number(booking.amount),
      specialRequests: booking.specialRequests,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      tour: booking.tour ? {
        id: booking.tour.id,
        title: booking.tour.title,
        description: booking.tour.description,
        location: booking.tour.location,
        price: Number(booking.tour.price),
        startDate: booking.tour.startDate,
        endDate: booking.tour.endDate,
        capacity: booking.tour.capacity,
        imageUrl: booking.tour.imageUrl,
        category: booking.tour.category,
        createdAt: booking.tour.createdAt,
        updatedAt: booking.tour.updatedAt,
        guide: booking.tour.guide ? {
          id: booking.tour.guide.id,
          name: booking.tour.guide.name,
          email: booking.tour.guide.email,
        } : null,
      } : undefined,
      user: booking.user ? {
        id: booking.user.id,
        email: booking.user.email,
        name: booking.user.name,
        avatar: booking.user.avatar,
        role: booking.user.role,
        createdAt: booking.user.createdAt,
      } : undefined,
    };
  }
}