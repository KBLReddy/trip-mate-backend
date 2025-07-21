import { Test, TestingModule } from '@nestjs/testing';
import { PostsService } from '../../src/posts/posts.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { NotificationsService } from '../../src/notifications/notifications.service';
import { PostSortBy } from '../../src/posts/dto/post-query.dto';

const mockPrisma = {
  post: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  postLike: {
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  // Add $transaction mock for toggleLike
  $transaction: jest.fn().mockImplementation(async (actions) => {
    // Simulate running all actions and returning their results
    return Promise.all(actions.map(fn => fn));
  }),
};
const mockNotificationsService = { createNotification: jest.fn() };

describe('PostsService', () => {
  let service: PostsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();
    service = module.get<PostsService>(PostsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new post', async () => {
      mockPrisma.post.create.mockResolvedValue({
        id: '1',
        title: 'Post',
        userId: 'user1',
        user: { id: 'user1', name: 'Test', email: 'test@test.com', avatar: null },
        _count: { comments: 0 },
      });
      const dto = { title: 'Post', content: 'Content' };
      const result = await service.create(dto, 'user1');
      expect(result).toBeDefined();
      expect(mockPrisma.post.create).toHaveBeenCalled();
    });
    it('should throw if post creation fails', async () => {
      mockPrisma.post.create.mockRejectedValue(new Error('DB error'));
      const dto = { title: 'Post', content: 'Content' };
      await expect(service.create(dto, 'user1')).rejects.toThrow('DB error');
    });
  });

  describe('findAll', () => {
    it('should return paginated posts', async () => {
      mockPrisma.post.findMany.mockResolvedValue([{ id: '1', title: 'Post', user: { id: 'user1', name: 'Test', email: 'test@test.com', avatar: null }, _count: { comments: 0 } }]);
      mockPrisma.post.count.mockResolvedValue(1);
      const query = { page: 1, limit: 10 };
      const result = await service.findAll(query);
      expect(result.data.length).toBeGreaterThanOrEqual(0);
      expect(result.total).toBe(1);
    });
    it('should handle empty result', async () => {
      mockPrisma.post.findMany.mockResolvedValue([]);
      mockPrisma.post.count.mockResolvedValue(0);
      const query = { page: 1, limit: 10 };
      const result = await service.findAll(query);
      expect(result.data.length).toBe(0);
      expect(result.total).toBe(0);
    });
    it('should sort by likes', async () => {
      mockPrisma.post.findMany.mockResolvedValue([{ id: '1', user: {}, _count: { comments: 0 }, likedBy: [] }]);
      mockPrisma.post.count.mockResolvedValue(1);
      const query = { sortBy: PostSortBy.LIKES, page: 1, limit: 10 };
      const result = await service.findAll(query);
      expect(result).toBeDefined();
    });
    it('should sort by comments', async () => {
      mockPrisma.post.findMany.mockResolvedValue([{ id: '1', user: {}, _count: { comments: 0 }, likedBy: [] }]);
      mockPrisma.post.count.mockResolvedValue(1);
      const query = { sortBy: PostSortBy.COMMENTS, page: 1, limit: 10 };
      const result = await service.findAll(query);
      expect(result).toBeDefined();
    });
    it('should sort by createdAt (default)', async () => {
      mockPrisma.post.findMany.mockResolvedValue([{ id: '1', user: {}, _count: { comments: 0 }, likedBy: [] }]);
      mockPrisma.post.count.mockResolvedValue(1);
      const query = { sortBy: PostSortBy.CREATED_AT, page: 1, limit: 10 };
      const result = await service.findAll(query);
      expect(result).toBeDefined();
    });
    it('should handle both search and userId', async () => {
      mockPrisma.post.findMany.mockResolvedValue([{ id: '1', user: {}, _count: { comments: 0 }, likedBy: [] }]);
      mockPrisma.post.count.mockResolvedValue(1);
      const query = { search: 'test', userId: 'user1', page: 1, limit: 10, sortBy: PostSortBy.CREATED_AT };
      const result = await service.findAll(query);
      expect(result).toBeDefined();
    });
    it('should handle empty search and userId', async () => {
      mockPrisma.post.findMany.mockResolvedValue([{ id: '1', user: {}, _count: { comments: 0 }, likedBy: [] }]);
      mockPrisma.post.count.mockResolvedValue(1);
      const query = { search: '', userId: '', page: 1, limit: 10, sortBy: PostSortBy.CREATED_AT };
      const result = await service.findAll(query);
      expect(result).toBeDefined();
    });
  });

  describe('findOne', () => {
    it('should throw if post not found', async () => {
      mockPrisma.post.findUnique.mockResolvedValue(null);
      await expect(service.findOne('bad', 'user1')).rejects.toThrow('Post not found');
    });
  });
  describe('update', () => {
    it('should throw if post not found', async () => {
      mockPrisma.post.findUnique.mockResolvedValue(null);
      await expect(service.update('bad', {}, 'user1')).rejects.toThrow('Post not found');
    });
    it('should throw if not author', async () => {
      mockPrisma.post.findUnique.mockResolvedValue({ id: 'p1', userId: 'other' });
      await expect(service.update('p1', {}, 'user1')).rejects.toThrow('You can only update your own posts');
    });
    it('should update and return a valid PostResponseDto', async () => {
      mockPrisma.post.findUnique.mockResolvedValue({ id: 'p1', userId: 'user1' });
      mockPrisma.post.update.mockResolvedValue({
        id: 'p1',
        userId: 'user1',
        title: 'T',
        content: 'C',
        user: { id: 'user1', name: 'Test', email: 'test@test.com', avatar: null },
        _count: { comments: 0 },
        likedBy: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        imageUrl: null,
        likes: 0,
      });
      const result = await service.update('p1', { title: 'T' }, 'user1');
      expect(result).toBeDefined();
    });
    it('should throw if post.update returns null', async () => {
      mockPrisma.post.findUnique.mockResolvedValue({ id: 'p1', userId: 'user1' });
      mockPrisma.post.update.mockResolvedValue(null);
      await expect(service.update('p1', { title: 'T' }, 'user1')).rejects.toThrow();
    });
  });
  describe('remove', () => {
    it('should throw if post not found', async () => {
      mockPrisma.post.findUnique.mockResolvedValue(null);
      await expect(service.remove('bad', 'user1', 'USER')).rejects.toThrow('Post not found');
    });
    it('should throw if not author or admin', async () => {
      mockPrisma.post.findUnique.mockResolvedValue({ id: 'p1', userId: 'other' });
      await expect(service.remove('p1', 'user1', 'USER')).rejects.toThrow('You can only delete your own posts');
    });
    it('should delete if author', async () => {
      mockPrisma.post.findUnique.mockResolvedValue({ id: 'p1', userId: 'user1' });
      mockPrisma.post.delete.mockResolvedValue({});
      await expect(service.remove('p1', 'user1', 'USER')).resolves.toBeUndefined();
    });
    it('should delete if admin', async () => {
      mockPrisma.post.findUnique.mockResolvedValue({ id: 'p1', userId: 'other' });
      mockPrisma.post.delete.mockResolvedValue({});
      await expect(service.remove('p1', 'admin', 'ADMIN')).resolves.toBeUndefined();
    });
  });
  describe('toggleLike', () => {
    it('should throw if post not found', async () => {
      mockPrisma.post.findUnique.mockResolvedValue(null);
      await expect(service.toggleLike('bad', 'user1')).rejects.toThrow('Post not found');
    });
    it('should like a post if not already liked (like branch)', async () => {
      mockPrisma.post.findUnique.mockResolvedValue({ id: 'p1', userId: 'other', likes: 0, title: 'T' });
      mockPrisma.postLike.findUnique.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue({ name: 'User' });
      mockPrisma.postLike.create.mockResolvedValue({});
      mockPrisma.post.update.mockResolvedValue({ likes: 1 });
      mockNotificationsService.createNotification.mockResolvedValue(undefined);
      const result = await service.toggleLike('p1', 'user1');
      expect(result.liked).toBe(true);
    });
    it('should unlike a post if already liked', async () => {
      mockPrisma.post.findUnique.mockResolvedValue({ id: 'p1', userId: 'other', likes: 1, title: 'T' });
      mockPrisma.postLike.findUnique.mockResolvedValue({ id: 'like1' });
      mockPrisma.postLike.delete.mockResolvedValue({});
      mockPrisma.post.update.mockResolvedValue({ likes: 0 });
      const result = await service.toggleLike('p1', 'user1');
      expect(result.liked).toBe(false);
    });
  });
  describe('getUserPosts', () => {
    it('should return posts for user', async () => {
      mockPrisma.post.findMany.mockResolvedValue([{ id: 'p1', user: {}, _count: { comments: 0 }, likedBy: [] }]);
      const result = await service.getUserPosts('user1', 'user1');
      expect(result.length).toBe(1);
    });
    it('should return empty array if no posts', async () => {
      mockPrisma.post.findMany.mockResolvedValue([]);
      const result = await service.getUserPosts('user1', 'user1');
      expect(result.length).toBe(0);
    });
  });

  // TODO: Add more tests for error/edge cases
}); 