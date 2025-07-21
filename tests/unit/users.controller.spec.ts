import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '../../src/users/users.controller';
import { UsersService } from '../../src/users/users.service';
import { Role, User } from '@prisma/client';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;
  const mockService = {
    update: jest.fn(),
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
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockService }],
    }).compile();
    controller = module.get(UsersController);
    service = module.get(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return user profile', async () => {
    const result = await controller.getProfile(mockUser);
    expect(result.email).toBe(mockUser.email);
  });
  it('should call updateProfile', async () => {
    const updatedUser = { ...mockUser, name: 'Updated' };
    mockService.update.mockResolvedValue(updatedUser);
    const result = await controller.updateProfile(mockUser, { name: 'Updated' });
    expect(service.update).toHaveBeenCalled();
    expect(result.name).toBe('Updated');
  });
}); 