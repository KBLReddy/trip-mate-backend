import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../../src/users/users.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      mockPrisma.user.create.mockResolvedValue({ id: '1', email: 'test@test.com', name: 'Test', passwordHash: 'hashed' });
      const result = await service.create('test@test.com', 'pass', 'Test');
      expect(result.email).toBe('test@test.com');
      expect(bcrypt.hash).toHaveBeenCalledWith('pass', 10);
    });
    it('should throw if user exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1', email: 'test@test.com' });
      await expect(service.create('test@test.com', 'pass', 'Test')).rejects.toThrow('User with this email already exists');
    });
  });

  describe('findByEmail', () => {
    it('should return user if found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1', email: 'test@test.com' });
      const result = await service.findByEmail('test@test.com');
      expect(result).toBeDefined();
    });
    it('should return null if not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const result = await service.findByEmail('notfound@test.com');
      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return user if found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1', email: 'test@test.com' });
      const result = await service.findById('1');
      expect(result).toBeDefined();
    });
    it('should return null if not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const result = await service.findById('2');
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update user if found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1', email: 'test@test.com' });
      mockPrisma.user.update.mockResolvedValue({ id: '1', email: 'test@test.com', name: 'Updated' });
      const result = await service.update('1', { name: 'Updated' });
      expect(result.name).toBe('Updated');
    });
    it('should throw if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.update('2', { name: 'Updated' })).rejects.toThrow('User not found');
    });
  });

  describe('validateUser', () => {
    it('should return user if password matches', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1', email: 'test@test.com', passwordHash: 'hashed' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      const result = await service.validateUser('test@test.com', 'pass');
      expect(result).toBeDefined();
    });
    it('should return null if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const result = await service.validateUser('notfound@test.com', 'pass');
      expect(result).toBeNull();
    });
    it('should return null if password does not match', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1', email: 'test@test.com', passwordHash: 'hashed' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      const result = await service.validateUser('test@test.com', 'wrong');
      expect(result).toBeNull();
    });
  });
}); 