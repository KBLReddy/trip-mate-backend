// src/notifications/notifications.controller.ts
import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { NotificationStatsDto } from './dto/notification-stats.dto';
import { MarkReadDto } from './dto/mark-read.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiResponse({ status: 200, description: 'List of notifications' })
  async findAll(
    @Query() query: NotificationQueryDto,
    @CurrentUser() user: User,
  ) {
    return this.notificationsService.findAll(user.id, query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get notification statistics' })
  @ApiResponse({
    status: 200,
    description: 'Notification statistics',
    type: NotificationStatsDto,
  })
  async getStats(@CurrentUser() user: User): Promise<NotificationStatsDto> {
    return this.notificationsService.getStats(user.id);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiResponse({ status: 200, description: 'Unread count' })
  async getUnreadCount(@CurrentUser() user: User): Promise<{ count: number }> {
    const count = await this.notificationsService.getUnreadCount(user.id);
    return { count };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notification details' })
  @ApiResponse({
    status: 200,
    description: 'Notification details',
    type: NotificationResponseDto,
  })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.findOne(id, user.id);
  }

  // src/notifications/notifications.controller.ts (continued)
  @Put('mark-read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark notifications as read' })
  @ApiResponse({ status: 200, description: 'Notifications marked as read' })
  async markAsRead(
    @Body() markReadDto: MarkReadDto,
    @CurrentUser() user: User,
  ): Promise<{ updated: number }> {
    return this.notificationsService.markAsRead(user.id, markReadDto);
  }

  @Put(':id/unread')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark notification as unread' })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as unread',
    type: NotificationResponseDto,
  })
  async markAsUnread(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.markAsUnread(id, user.id);
  }

  @Delete('clear')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear all notifications' })
  @ApiResponse({ status: 200, description: 'All notifications cleared' })
  async clearAll(@CurrentUser() user: User): Promise<{ deleted: number }> {
    return this.notificationsService.clearAll(user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiResponse({ status: 204, description: 'Notification deleted' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.notificationsService.remove(id, user.id);
  }
}
