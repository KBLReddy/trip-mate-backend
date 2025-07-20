// src/notifications/notifications.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { NotificationStatsDto } from './dto/notification-stats.dto';
import { MarkReadDto } from './dto/mark-read.dto';
import { Prisma, NotificationType } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, query: NotificationQueryDto) {
    const { type, isRead, page = 1, limit = 20 } = query;

    const where: Prisma.NotificationWhereInput = {
      userId,
    };

    if (type) {
      where.type = type;
    }

    if (isRead !== undefined) {
      where.isRead = isRead;
    }

    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      data: notifications.map(notification => ({
        id: notification.id,
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
        content: notification.content,
        isRead: notification.isRead,
        relatedId: notification.relatedId,
        createdAt: notification.createdAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    };
  }

  async findOne(id: string, userId: string): Promise<NotificationResponseDto> {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('You can only view your own notifications');
    }

    return {
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      content: notification.content,
      isRead: notification.isRead,
      relatedId: notification.relatedId,
      createdAt: notification.createdAt,
    };
  }

  async markAsRead(userId: string, markReadDto: MarkReadDto): Promise<{ updated: number }> {
    const { notificationIds } = markReadDto;

    if (notificationIds && notificationIds.length > 0) {
      // Mark specific notifications as read
      const result = await this.prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });

      return { updated: result.count };
    } else {
      // Mark all notifications as read
      const result = await this.prisma.notification.updateMany({
        where: {
          userId,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });

      return { updated: result.count };
    }
  }

  async markAsUnread(id: string, userId: string): Promise<NotificationResponseDto> {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('You can only update your own notifications');
    }

    const updated = await this.prisma.notification.update({
      where: { id },
      data: { isRead: false },
    });

    return {
      id: updated.id,
      userId: updated.userId,
      type: updated.type,
      title: updated.title,
      content: updated.content,
      isRead: updated.isRead,
      relatedId: updated.relatedId,
      createdAt: updated.createdAt,
    };
  }

  async remove(id: string, userId: string): Promise<void> {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('You can only delete your own notifications');
    }

    await this.prisma.notification.delete({
      where: { id },
    });
  }

  async clearAll(userId: string): Promise<{ deleted: number }> {
    const result = await this.prisma.notification.deleteMany({
      where: { userId },
    });

    return { deleted: result.count };
  }

  async getStats(userId: string): Promise<NotificationStatsDto> {
    const [total, unread, byType] = await Promise.all([
      this.prisma.notification.count({
        where: { userId },
      }),
      this.prisma.notification.count({
        where: { userId, isRead: false },
      }),
      this.prisma.notification.groupBy({
        by: ['type'],
        where: { userId },
        _count: true,
      }),
    ]);

    const byTypeMap = byType.reduce((acc, curr) => {
      acc[curr.type] = curr._count;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      unread,
      read: total - unread,
      byType: byTypeMap,
    };
  }

  // Helper method to create notifications (used by other services)
  async createNotification(data: {
    userId: string;
    type: NotificationType;
    title: string;
    content: string;
    relatedId?: string;
  }): Promise<void> {
    await this.prisma.notification.create({
      data,
    });
  }

  // Get unread count for header/navbar
  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }
}