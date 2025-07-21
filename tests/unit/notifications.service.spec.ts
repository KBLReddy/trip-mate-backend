import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from '../../src/notifications/notifications.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { NotificationType } from '@prisma/client';

const mockPrisma = {
  notification: {
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    updateMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    groupBy: jest.fn(),
    create: jest.fn(),
  },
};

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated notifications', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([{ id: 'n1', userId: 'u1', type: 'BOOKING_CONFIRMED', title: '', content: '', isRead: false, relatedId: null, createdAt: new Date() }]);
      mockPrisma.notification.count.mockResolvedValue(1);
      const result = await service.findAll('u1', { page: 1, limit: 10 });
      expect(result.data.length).toBeGreaterThanOrEqual(0);
      expect(result.total).toBe(1);
    });
    it('should filter by type', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([]);
      mockPrisma.notification.count.mockResolvedValue(0);
      const query = { type: NotificationType.BOOKING_CONFIRMED, page: 1, limit: 10 };
      const result = await service.findAll('u1', query);
      expect(result.data).toEqual([]);
    });
    it('should filter by isRead', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([]);
      mockPrisma.notification.count.mockResolvedValue(0);
      const query = { isRead: true, page: 1, limit: 10 };
      const result = await service.findAll('u1', query);
      expect(result.data).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a notification if found and user matches', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue({ id: 'n1', userId: 'u1', type: 'BOOKING_CONFIRMED', title: '', content: '', isRead: false, relatedId: null, createdAt: new Date() });
      const result = await service.findOne('n1', 'u1');
      expect(result).toBeDefined();
    });
    it('should throw if not found', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue(null);
      await expect(service.findOne('bad', 'u1')).rejects.toThrow('Notification not found');
    });
    it('should throw if user does not match', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue({ id: 'n1', userId: 'other', type: 'BOOKING_CONFIRMED', title: '', content: '', isRead: false, relatedId: null, createdAt: new Date() });
      await expect(service.findOne('n1', 'u1')).rejects.toThrow('You can only view your own notifications');
    });
  });

  describe('markAsRead', () => {
    it('should mark specific notifications as read', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 2 });
      const result = await service.markAsRead('u1', { notificationIds: ['n1', 'n2'] });
      expect(result.updated).toBe(2);
    });
    it('should mark all notifications as read', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 5 });
      const result = await service.markAsRead('u1', { notificationIds: [] });
      expect(result.updated).toBe(5);
    });
    it('should mark all as read if notificationIds is undefined', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 3 });
      const result = await service.markAsRead('u1', {});
      expect(result.updated).toBe(3);
    });
  });

  describe('markAsUnread', () => {
    it('should mark notification as unread', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue({ id: 'n1', userId: 'u1' });
      mockPrisma.notification.update.mockResolvedValue({ id: 'n1', userId: 'u1', isRead: false });
      const result = await service.markAsUnread('n1', 'u1');
      expect(result.isRead).toBe(false);
    });
    it('should throw if notification not found', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue(null);
      await expect(service.markAsUnread('bad', 'u1')).rejects.toThrow('Notification not found');
    });
    it('should throw if user does not match', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue({ id: 'n1', userId: 'other' });
      await expect(service.markAsUnread('n1', 'u1')).rejects.toThrow('You can only update your own notifications');
    });
  });

  describe('remove', () => {
    it('should remove notification', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue({ id: 'n1', userId: 'u1' });
      mockPrisma.notification.delete.mockResolvedValue({});
      await expect(service.remove('n1', 'u1')).resolves.toBeUndefined();
    });
    it('should throw if notification not found', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue(null);
      await expect(service.remove('bad', 'u1')).rejects.toThrow('Notification not found');
    });
    it('should throw if user does not match', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue({ id: 'n1', userId: 'other' });
      await expect(service.remove('n1', 'u1')).rejects.toThrow('You can only delete your own notifications');
    });
  });

  describe('clearAll', () => {
    it('should clear all notifications for user', async () => {
      mockPrisma.notification.deleteMany.mockResolvedValue({ count: 3 });
      const result = await service.clearAll('u1');
      expect(result.deleted).toBe(3);
    });
  });

  describe('getStats', () => {
    it('should return notification stats', async () => {
      mockPrisma.notification.count.mockResolvedValueOnce(10); // total
      mockPrisma.notification.count.mockResolvedValueOnce(3); // unread
      mockPrisma.notification.groupBy.mockResolvedValue([{ type: 'BOOKING_CONFIRMED', _count: 5 }, { type: 'POST_LIKED', _count: 5 }]);
      const result = await service.getStats('u1');
      expect(result.total).toBe(10);
      expect(result.unread).toBe(3);
      expect(result.read).toBe(7);
      expect(result.byType).toEqual({ BOOKING_CONFIRMED: 5, POST_LIKED: 5 });
    });
    it('should handle empty groupBy', async () => {
      mockPrisma.notification.count.mockResolvedValueOnce(0);
      mockPrisma.notification.count.mockResolvedValueOnce(0);
      mockPrisma.notification.groupBy.mockResolvedValue([]);
      const result = await service.getStats('u1');
      expect(result.total).toBe(0);
      expect(result.unread).toBe(0);
      expect(result.read).toBe(0);
      expect(result.byType).toEqual({});
    });
    it('should handle DB error in getStats', async () => {
      mockPrisma.notification.count.mockRejectedValue(new Error('DB error'));
      await expect(service.getStats('u1')).rejects.toThrow('DB error');
    });
  });

  describe('createNotification', () => {
    it('should create a notification', async () => {
      mockPrisma.notification.create.mockResolvedValue({});
      await expect(service.createNotification({ userId: 'u1', type: 'BOOKING_CONFIRMED', title: 't', content: 'c' })).resolves.toBeUndefined();
    });
    it('should handle DB error in createNotification', async () => {
      mockPrisma.notification.create.mockRejectedValue(new Error('DB error'));
      await expect(service.createNotification({ userId: 'u1', type: 'BOOKING_CONFIRMED', title: 't', content: 'c' })).rejects.toThrow('DB error');
    });
    it('should handle missing required fields', async () => {
      mockPrisma.notification.create.mockRejectedValue(new Error('Missing required fields'));
      await expect(service.createNotification({ userId: '', type: 'BOOKING_CONFIRMED', title: '', content: '' })).rejects.toThrow('Missing required fields');
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      mockPrisma.notification.count.mockResolvedValue(4);
      const result = await service.getUnreadCount('u1');
      expect(result).toBe(4);
    });
    it('should handle DB error in getUnreadCount', async () => {
      mockPrisma.notification.count.mockRejectedValue(new Error('DB error'));
      await expect(service.getUnreadCount('u1')).rejects.toThrow('DB error');
    });
  });
}); 