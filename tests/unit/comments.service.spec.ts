import { Test, TestingModule } from '@nestjs/testing';
import { CommentsService } from '../../src/comments/comments.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { NotificationsService } from '../../src/notifications/notifications.service';

const mockPrisma = {
  post: { findUnique: jest.fn() },
  comment: { create: jest.fn(), findUnique: jest.fn(), delete: jest.fn(), findMany: jest.fn(), count: jest.fn() },
  user: { findUnique: jest.fn() },
  notification: { create: jest.fn() },
};
const mockNotificationsService = { createNotification: jest.fn() };

describe('CommentsService', () => {
  let service: CommentsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();
    service = module.get<CommentsService>(CommentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw if post not found', async () => {
      mockPrisma.post.findUnique.mockResolvedValue(null);
      await expect(service.create('post1', { content: 'hi' }, 'user1')).rejects.toThrow('Post not found');
    });
    it('should create notification if commenter is not post author', async () => {
      mockPrisma.post.findUnique.mockResolvedValue({ id: 'post1', userId: 'author1', title: 'Post' });
      mockPrisma.comment.create.mockResolvedValue({ id: 'c1', userId: 'user1', postId: 'post1', content: 'hi', user: { name: 'User' } });
      mockPrisma.user.findUnique.mockResolvedValue({ name: 'User' });
      mockNotificationsService.createNotification.mockResolvedValue(undefined);
      const result = await service.create('post1', { content: 'hi' }, 'user1');
      expect(mockNotificationsService.createNotification).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
    it('should not create notification if commenter is post author', async () => {
      mockPrisma.post.findUnique.mockResolvedValue({ id: 'post1', userId: 'user1', title: 'Post' });
      mockPrisma.comment.create.mockResolvedValue({ id: 'c1', userId: 'user1', postId: 'post1', content: 'hi', user: { name: 'User' } });
      const result = await service.create('post1', { content: 'hi' }, 'user1');
      expect(mockNotificationsService.createNotification).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });
  describe('findByPost', () => {
    it('should throw if post not found', async () => {
      mockPrisma.post.findUnique.mockResolvedValue(null);
      await expect(service.findByPost('post1', 1, 10)).rejects.toThrow('Post not found');
    });
    it('should paginate results', async () => {
      mockPrisma.post.findUnique.mockResolvedValue({ id: 'post1' });
      mockPrisma.comment.findMany.mockResolvedValue([{ id: 'c1', user: {} }]);
      mockPrisma.comment.count.mockResolvedValue(1);
      const result = await service.findByPost('post1', 1, 1);
      expect(result.data.length).toBe(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(1);
    });
  });
  describe('remove', () => {
    it('should throw if comment not found', async () => {
      mockPrisma.comment.findUnique.mockResolvedValue(null);
      await expect(service.remove('c1', 'user1', 'USER')).rejects.toThrow('Comment not found');
    });
    it('should throw if not author or admin', async () => {
      mockPrisma.comment.findUnique.mockResolvedValue({ id: 'c1', userId: 'other' });
      await expect(service.remove('c1', 'user1', 'USER')).rejects.toThrow('You can only delete your own comments');
    });
    it('should delete if author', async () => {
      mockPrisma.comment.findUnique.mockResolvedValue({ id: 'c1', userId: 'user1' });
      mockPrisma.comment.delete.mockResolvedValue({});
      await expect(service.remove('c1', 'user1', 'USER')).resolves.toBeUndefined();
    });
    it('should delete if admin', async () => {
      mockPrisma.comment.findUnique.mockResolvedValue({ id: 'c1', userId: 'other' });
      mockPrisma.comment.delete.mockResolvedValue({});
      await expect(service.remove('c1', 'admin', 'ADMIN')).resolves.toBeUndefined();
    });
    it('should delete if admin and not author', async () => {
      mockPrisma.comment.findUnique.mockResolvedValue({ id: 'c1', userId: 'other' });
      mockPrisma.comment.delete.mockResolvedValue({});
      await expect(service.remove('c1', 'admin', 'ADMIN')).resolves.toBeUndefined();
    });
  });

  // TODO: Add more tests for error/edge cases
}); 