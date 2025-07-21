import { Test, TestingModule } from '@nestjs/testing';
import { PostsController } from '../../src/posts/posts.controller';
import { PostsService } from '../../src/posts/posts.service';
import { Role } from '@prisma/client';
import { CreatePostDto } from '../../src/posts/dto/create-post.dto';
import { User } from '@prisma/client';

describe('PostsController', () => {
  let controller: PostsController;
  let service: PostsService;
  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    getUserPosts: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    toggleLike: jest.fn(),
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
      controllers: [PostsController],
      providers: [{ provide: PostsService, useValue: mockService }],
    }).compile();
    controller = module.get(PostsController);
    service = module.get(PostsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call create', async () => {
    const dto: CreatePostDto = { title: 'Post', content: 'Content' };
    await controller.create(dto, mockUser);
    expect(service.create).toHaveBeenCalled();
  });
  it('should call findAll', async () => {
    await controller.findAll({}, mockUser);
    expect(service.findAll).toHaveBeenCalled();
  });
  it('should call getUserPosts', async () => {
    await controller.getUserPosts('user1', mockUser);
    expect(service.getUserPosts).toHaveBeenCalled();
  });
  it('should call findOne', async () => {
    await controller.findOne('id', mockUser);
    expect(service.findOne).toHaveBeenCalled();
  });
  it('should call update', async () => {
    await controller.update('id', {}, mockUser);
    expect(service.update).toHaveBeenCalled();
  });
  it('should call remove', async () => {
    await controller.remove('id', mockUser);
    expect(service.remove).toHaveBeenCalled();
  });
  it('should call toggleLike', async () => {
    await controller.toggleLike('id', mockUser);
    expect(service.toggleLike).toHaveBeenCalled();
  });
}); 