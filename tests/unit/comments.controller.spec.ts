import { Test, TestingModule } from '@nestjs/testing';
import { CommentsController } from '../../src/comments/comments.controller';
import { CommentsService } from '../../src/comments/comments.service';
import { Role } from '@prisma/client';
import { CreateCommentDto } from '../../src/comments/dto/create-comment.dto';
import { User } from '@prisma/client';

describe('CommentsController', () => {
  let controller: CommentsController;
  let service: CommentsService;
  const mockService = {
    create: jest.fn(),
    findByPost: jest.fn(),
    remove: jest.fn(),
  };
  const mockUser: User = {
    id: 'user1',
    name: 'Test User',
    email: 'test@example.com',
    passwordHash: 'hash',
    avatar: null,
    role: Role.USER,
    isVerified: false,
    otp: null,
    otpExpiresAt: null,
    otpAttempts: 0,
    otpLastSent: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommentsController],
      providers: [{ provide: CommentsService, useValue: mockService }],
    }).compile();
    controller = module.get(CommentsController);
    service = module.get(CommentsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call create', async () => {
    const dto: CreateCommentDto = { content: 'Nice comment' };
    await controller.create('post1', dto, mockUser);
    expect(service.create).toHaveBeenCalled();
  });
  it('should call findByPost', async () => {
    await controller.findByPost('post1', '1', '10');
    expect(service.findByPost).toHaveBeenCalled();
  });
  it('should call remove', async () => {
    await controller.remove('id', mockUser);
    expect(service.remove).toHaveBeenCalled();
  });
  it('should throw if user is not author or admin', async () => {
    mockService.remove.mockRejectedValue(new Error('You can only delete your own comments'));
    await expect(controller.remove('id', { ...mockUser, id: 'other', role: Role.USER })).rejects.toThrow('You can only delete your own comments');
  });
}); 