import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from '../../src/notifications/notifications.controller';
import { NotificationsService } from '../../src/notifications/notifications.service';
import { Role, User } from '@prisma/client';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: NotificationsService;
  const mockService = {
    findAll: jest.fn(),
    getStats: jest.fn(),
    getUnreadCount: jest.fn(),
    findOne: jest.fn(),
    markAsRead: jest.fn(),
    markAsUnread: jest.fn(),
    clearAll: jest.fn(),
    remove: jest.fn(),
  };
  const mockUser: User = {
    id: 'user1',
    name: 'Test User',
    email: 'test@example.com',
    passwordHash: 'hash',
    avatar: null,
    role: Role.USER,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [{ provide: NotificationsService, useValue: mockService }],
    }).compile();
    controller = module.get(NotificationsController);
    service = module.get(NotificationsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call findAll', async () => {
    await controller.findAll({}, mockUser);
    expect(service.findAll).toHaveBeenCalled();
  });
  it('should call getStats', async () => {
    await controller.getStats(mockUser);
    expect(service.getStats).toHaveBeenCalled();
  });
  it('should call getUnreadCount', async () => {
    await controller.getUnreadCount(mockUser);
    expect(service.getUnreadCount).toHaveBeenCalled();
  });
  it('should call findOne', async () => {
    await controller.findOne('id', mockUser);
    expect(service.findOne).toHaveBeenCalled();
  });
  it('should call markAsRead', async () => {
    await controller.markAsRead({}, mockUser);
    expect(service.markAsRead).toHaveBeenCalled();
  });
  it('should call markAsUnread', async () => {
    await controller.markAsUnread('id', mockUser);
    expect(service.markAsUnread).toHaveBeenCalled();
  });
  it('should call clearAll', async () => {
    await controller.clearAll(mockUser);
    expect(service.clearAll).toHaveBeenCalled();
  });
  it('should call remove', async () => {
    await controller.remove('id', mockUser);
    expect(service.remove).toHaveBeenCalled();
  });
}); 