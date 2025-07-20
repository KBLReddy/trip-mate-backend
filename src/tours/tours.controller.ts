// src/tours/tours.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiQuery 
} from '@nestjs/swagger';
import { ToursService } from './tours.service';
import { CreateTourDto } from './dto/create-tour.dto';
import { UpdateTourDto } from './dto/update-tour.dto';
import { TourResponseDto } from './dto/tour-response.dto';
import { TourQueryDto } from './dto/tour-query.dto';
import { PaginatedToursDto } from './dto/paginated-tours.dto';
import { TourStatisticsDto } from './dto/tour-statistics.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role, User } from '@prisma/client';

@ApiTags('tours')
@Controller('tours')
export class ToursController {
  constructor(private readonly toursService: ToursService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.GUIDE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new tour (Admin/Guide only)' })
  @ApiResponse({ status: 201, description: 'Tour created successfully', type: TourResponseDto })
  async create(
    @Body() createTourDto: CreateTourDto,
    @CurrentUser() user: User,
  ): Promise<TourResponseDto> {
    return this.toursService.create(createTourDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tours with filters and pagination' })
  @ApiResponse({ status: 200, description: 'List of tours', type: PaginatedToursDto })
  async findAll(@Query() query: TourQueryDto): Promise<PaginatedToursDto> {
    return this.toursService.findAll(query);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all tour categories' })
  @ApiResponse({ status: 200, description: 'List of categories', type: [String] })
  async getCategories(): Promise<string[]> {
    return this.toursService.getCategories();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tour details by ID' })
  @ApiResponse({ status: 200, description: 'Tour details', type: TourResponseDto })
  @ApiResponse({ status: 404, description: 'Tour not found' })
  async findOne(@Param('id') id: string): Promise<TourResponseDto> {
    return this.toursService.findOne(id);
  }

  @Get(':id/availability')
  @ApiOperation({ summary: 'Get available capacity for a tour' })
  @ApiResponse({ status: 200, description: 'Available capacity' })
  async getAvailability(@Param('id') id: string): Promise<{ availableCapacity: number }> {
    const availableCapacity = await this.toursService.getAvailableCapacity(id);
    return { availableCapacity };
  }
    // Add this endpoint to tours.controller.ts (before the :id routes)
  @Get('statistics/overview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get tour statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Tour statistics', type: TourStatisticsDto })
  async getStatistics(): Promise<TourStatisticsDto> {
    return this.toursService.getStatistics();
  }
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.GUIDE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update tour (Admin/Guide only)' })
  @ApiResponse({ status: 200, description: 'Tour updated successfully', type: TourResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Tour not found' })
  async update(
    @Param('id') id: string,
    @Body() updateTourDto: UpdateTourDto,
    @CurrentUser() user: User,
  ): Promise<TourResponseDto> {
    return this.toursService.update(id, updateTourDto, user.id, user.role);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.GUIDE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete tour (Admin/Guide only)' })
  @ApiResponse({ status: 200, description: 'Tour deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden or tour has active bookings' })
  @ApiResponse({ status: 404, description: 'Tour not found' })
  async remove(@Param('id') id: string, @CurrentUser() user: User): Promise<void> {
    return this.toursService.remove(id, user.id, user.role);
  }


  @Get('search/suggestions')
  @ApiOperation({ summary: 'Get search suggestions for autocomplete' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query (min 2 characters)' })
  @ApiResponse({ status: 200, description: 'Search suggestions' })
  async getSearchSuggestions(@Query('q') query: string): Promise<{ locations: string[]; titles: string[] }> {
    return this.toursService.getSearchSuggestions(query);
  }
}