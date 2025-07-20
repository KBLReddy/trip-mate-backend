// src/bookings/bookings.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { BookingResponseDto } from './dto/booking-response.dto';
import { BookingQueryDto } from './dto/booking-query.dto';
import { BookingStatisticsDto } from './dto/booking-statistics.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role, User } from '@prisma/client';

@ApiTags('bookings')
@Controller('bookings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new booking' })
  @ApiResponse({ status: 201, description: 'Booking created successfully', type: BookingResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - Tour full or already booked' })
  async create(
    @Body() createBookingDto: CreateBookingDto,
    @CurrentUser() user: User,
  ): Promise<BookingResponseDto> {
    return this.bookingsService.create(createBookingDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all bookings (Admin sees all, users see own)' })
  @ApiResponse({ status: 200, description: 'List of bookings' })
  async findAll(
    @Query() query: BookingQueryDto,
    @CurrentUser() user: User,
  ) {
    return this.bookingsService.findAll(user.id, user.role, query);
  }

  @Get('my-bookings')
  @ApiOperation({ summary: 'Get current user bookings' })
  @ApiResponse({ status: 200, description: 'List of user bookings' })
  async getMyBookings(
    @Query() query: BookingQueryDto,
    @CurrentUser() user: User,
  ) {
    return this.bookingsService.getMyBookings(user.id, query);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get booking statistics' })
  @ApiResponse({ status: 200, description: 'Booking statistics', type: BookingStatisticsDto })
  async getStatistics(@CurrentUser() user: User): Promise<BookingStatisticsDto> {
    return this.bookingsService.getStatistics(user.id, user.role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking details' })
  @ApiResponse({ status: 200, description: 'Booking details', type: BookingResponseDto })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<BookingResponseDto> {
    return this.bookingsService.findOne(id, user.id, user.role);
  }

  @Put(':id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update booking status (Admin only)' })
  @ApiResponse({ status: 200, description: 'Booking updated', type: BookingResponseDto })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateBookingStatusDto: UpdateBookingStatusDto,
    @CurrentUser() user: User,
  ): Promise<BookingResponseDto> {
    return this.bookingsService.updateStatus(id, updateBookingStatusDto, user.id, user.role);
  }

  @Put(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a booking' })
  @ApiResponse({ status: 200, description: 'Booking cancelled', type: BookingResponseDto })
  @ApiResponse({ status: 400, description: 'Cannot cancel - Tour started or booking completed' })
  async cancel(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<BookingResponseDto> {
    return this.bookingsService.cancel(id, user.id);
  }

  @Put(':id/confirm-payment')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm payment for booking (Admin only)' })
  @ApiResponse({ status: 200, description: 'Payment confirmed', type: BookingResponseDto })
  async confirmPayment(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<BookingResponseDto> {
    return this.bookingsService.confirmPayment(id, user.id, user.role);
  }
}