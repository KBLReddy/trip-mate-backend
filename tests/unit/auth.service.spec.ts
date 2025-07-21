import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../src/auth/auth.service';
import { UsersService } from '../../src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../src/prisma/prisma.service';
import { RegisterDto } from '../../src/auth/dto/register.dto';
import { LoginDto } from '../../src/auth/dto/login.dto';

// Mocks
const mockUsersService = {
  create: jest.fn(),
  validateUser: jest.fn(),
  findById: jest.fn(),
};
const mockJwtService = { sign: jest.fn(), signAsync: jest.fn() };
const mockConfigService = { get: jest.fn() };
const mockPrisma = {
  user: { update: jest.fn() },
  refreshToken: { create: jest.fn(), deleteMany: jest.fn(), findFirst: jest.fn(), delete: jest.fn() },
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockJwtService.sign.mockReturnValue('token');
    mockJwtService.signAsync.mockResolvedValue('token');
    mockPrisma.refreshToken.create.mockResolvedValue({});
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user and return tokens', async () => {
      const dto: RegisterDto = { email: 'test@test.com', password: 'pass', name: 'Test' };
      const user = { id: '1', email: dto.email, name: dto.name, role: 'USER' };
      mockUsersService.create.mockResolvedValue(user);
      mockPrisma.user.update.mockResolvedValue({});

      const result = await service.register(dto);
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe(dto.email);
    });

    it('should throw if user already exists', async () => {
      mockUsersService.create.mockRejectedValueOnce(new Error('User with this email already exists'));
      await expect(service.register({ email: 'exists@test.com', password: 'pass', name: 'Test' }))
        .rejects.toThrow('User with this email already exists');
    });
  });

  describe('login', () => {
    it('should login a valid user and return tokens', async () => {
      const dto: LoginDto = { email: 'test@test.com', password: 'pass' };
      const user = { id: '1', email: dto.email, name: 'Test', role: 'USER' };
      mockUsersService.validateUser.mockResolvedValue(user);
      mockPrisma.user.update.mockResolvedValue({});

      const result = await service.login(dto);
      expect(result).toHaveProperty('accessToken');
      expect(result.user.email).toBe(dto.email);
    });

    it('should throw if credentials are invalid', async () => {
      mockUsersService.validateUser.mockResolvedValue(null);
      await expect(service.login({ email: 'wrong@test.com', password: 'bad' }))
        .rejects.toThrow('Invalid credentials');
    });
  });

  describe('logout', () => {
    it('should call prisma.refreshToken.deleteMany with correct args', async () => {
      mockPrisma.refreshToken.deleteMany = jest.fn().mockResolvedValue({});
      await service.logout('user1', 'refreshToken');
      expect(mockPrisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user1', token: 'refreshToken' },
      });
    });
  });

  describe('refreshTokens', () => {
    it('should throw if user not found', async () => {
      mockUsersService.findById = jest.fn().mockResolvedValue(null);
      await expect(service.refreshTokens('user1', 'refreshToken')).rejects.toThrow('Access Denied');
    });
    it('should throw if refresh token not found', async () => {
      mockUsersService.findById = jest.fn().mockResolvedValue({ id: 'user1', email: 'a', name: 'b', role: 'USER' });
      mockPrisma.refreshToken.findFirst = jest.fn().mockResolvedValue(null);
      await expect(service.refreshTokens('user1', 'refreshToken')).rejects.toThrow('Access Denied');
    });
    it('should throw if refresh token expired', async () => {
      mockUsersService.findById = jest.fn().mockResolvedValue({ id: 'user1', email: 'a', name: 'b', role: 'USER' });
      mockPrisma.refreshToken.findFirst = jest.fn().mockResolvedValue({ id: 'rt1', expiresAt: new Date(Date.now() - 1000) });
      mockPrisma.refreshToken.delete = jest.fn().mockResolvedValue({});
      await expect(service.refreshTokens('user1', 'refreshToken')).rejects.toThrow('Refresh token expired');
      expect(mockPrisma.refreshToken.delete).toHaveBeenCalledWith({ where: { id: 'rt1' } });
    });
    it('should refresh tokens and save new refresh token', async () => {
      const user = { id: 'user1', email: 'a', name: 'b', role: 'USER' };
      mockUsersService.findById = jest.fn().mockResolvedValue(user);
      mockPrisma.refreshToken.findFirst = jest.fn().mockResolvedValue({ id: 'rt1', expiresAt: new Date(Date.now() + 100000) });
      mockPrisma.refreshToken.delete = jest.fn().mockResolvedValue({});
      mockJwtService.signAsync = jest.fn().mockResolvedValue('token');
      mockConfigService.get = jest.fn().mockReturnValue('secret');
      mockPrisma.refreshToken.create = jest.fn().mockResolvedValue({});
      const result = await service.refreshTokens('user1', 'refreshToken');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.id).toBe('user1');
      expect(mockPrisma.refreshToken.create).toHaveBeenCalled();
    });
  });

  // TODO: Add more tests for refresh, error/edge cases, etc.
}); 