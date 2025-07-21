// src/app.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from './prisma/prisma.service';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('info')
  @ApiOperation({ summary: 'API root endpoint' })
  @ApiResponse({ status: 200, description: 'API information' })
  getHello() {
    return {
      name: 'TripMate API',
      version: '1.0.0',
      description: 'Tour booking platform with community features',
      documentation: '/api/docs',
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service health status' })
  async healthCheck() {
    try {
      // Check database connection
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          api: 'up',
          database: 'up',
        },
      };
    } catch {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        services: {
          api: 'up',
          database: 'down',
        },
        error: 'Database connection failed',
      };
    }
  }
}
