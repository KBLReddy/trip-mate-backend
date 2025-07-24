import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../src/auth/auth.service';
import { UsersService } from '../../src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../src/prisma/prisma.service';
import { RegisterDto } from '../../src/auth/dto/register.dto';
import { LoginDto } from '../../src/auth/dto/login.dto';
import { MailService } from '../../src/mail/mail.service';

// Mocks
const mockUsersService = {
  create: jest.fn(),
  createUnverified: jest.fn(),
  validateUser: jest.fn(),
  findById: jest.fn(),
};
const mockJwtService = { sign: jest.fn(), signAsync: jest.fn() };
const mockConfigService = { get: jest.fn() };
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(),
  },
  refreshToken: { create: jest.fn(), deleteMany: jest.fn(), findFirst: jest.fn(), delete: jest.fn() },
};
const mockMailService = { sendOTPEmail: jest.fn(), sendWelcomeEmail: jest.fn() };

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockMailService.sendOTPEmail.mockResolvedValue(undefined);
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
        { provide: MailService, useValue: mockMailService },
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
      mockUsersService.createUnverified.mockResolvedValue(user);
      mockPrisma.user.update.mockResolvedValue({});

      const result = await service.register(dto);
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('expiresIn');
      expect(result.email).toBe(dto.email);
    });

    it('should throw if user already exists', async () => {
      // Simulate user already exists in DB and is verified
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1', email: 'exists@test.com', isVerified: true });
      await expect(service.register({ email: 'exists@test.com', password: 'pass', name: 'Test' }))
        .rejects.toThrow('User already exists');
    });
  });

  describe('login', () => {
    it('should login a valid user and return tokens', async () => {
      const dto: LoginDto = { email: 'test@test.com', password: 'pass' };
      const user = { id: '1', email: dto.email, name: 'Test', role: 'USER', isVerified: true };
      mockUsersService.validateUser.mockResolvedValue(user);
      mockPrisma.user.update.mockResolvedValue({});
      mockJwtService.signAsync.mockResolvedValue('token');
      mockConfigService.get.mockReturnValue('secret');
      mockPrisma.refreshToken.create.mockResolvedValue({});
      mockPrisma.refreshToken.deleteMany.mockResolvedValue({});
      mockPrisma.refreshToken.findFirst.mockResolvedValue({ id: 'rt1', expiresAt: new Date(Date.now() + 100000) });
      mockPrisma.refreshToken.delete.mockResolvedValue({});
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

  describe('verifyOTP', () => {
    const userId = 'user1';
    const otp = '123456';
    const baseUser = {
      id: userId,
      email: 'test@example.com',
      name: 'Test',
      isVerified: false,
      otp: '123456',
      otpExpiresAt: new Date(Date.now() + 10000),
      otpAttempts: 0,
      otpLastSent: new Date(),
      role: 'USER',
    };
    it('should throw if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.verifyOTP(userId, otp)).rejects.toThrow('Invalid verification request');
    });
    it('should throw if already verified', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...baseUser, isVerified: true });
      await expect(service.verifyOTP(userId, otp)).rejects.toThrow('Email already verified');
    });
    it('should throw if too many OTP attempts', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...baseUser, otpAttempts: 5 });
      await expect(service.verifyOTP(userId, otp)).rejects.toThrow('Too many failed attempts. Please request a new code.');
    });
    it('should throw if OTP expired', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...baseUser, otpExpiresAt: new Date(Date.now() - 1000) });
      await expect(service.verifyOTP(userId, otp)).rejects.toThrow('Verification code expired. Please request a new one.');
    });
    it('should throw if OTP is invalid', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...baseUser, otp: '654321', otpAttempts: 2 });
      mockPrisma.user.update.mockResolvedValue({});
      await expect(service.verifyOTP(userId, otp)).rejects.toThrow('Invalid verification code. 2 attempts remaining.');
    });
    it('should verify user and send welcome email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(baseUser);
      mockPrisma.user.update.mockResolvedValue({ ...baseUser, isVerified: true, otp: null, otpExpiresAt: null, otpAttempts: 0 });
      mockJwtService.signAsync.mockResolvedValue('token');
      mockConfigService.get.mockReturnValue('secret');
      mockPrisma.refreshToken.create.mockResolvedValue({});
      mockMailService.sendWelcomeEmail = jest.fn().mockResolvedValue(undefined);
      const result = await service.verifyOTP(userId, otp);
      expect(result).toHaveProperty('accessToken');
      expect(result.user.id).toBe(userId);
    });
  });

  describe('resendOTP', () => {
    const userId = 'user1';
    const baseUser = {
      id: userId,
      email: 'test@example.com',
      name: 'Test',
      isVerified: false,
      otp: '123456',
      otpExpiresAt: new Date(Date.now() + 10000),
      otpAttempts: 0,
      otpLastSent: new Date(Date.now() - 2 * 60 * 1000), // 2 min ago
      role: 'USER',
    };
    it('should throw if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.resendOTP(userId)).rejects.toThrow('Invalid request');
    });
    it('should throw if already verified', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...baseUser, isVerified: true });
      await expect(service.resendOTP(userId)).rejects.toThrow('Email already verified');
    });
    it('should throw if rate limited', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...baseUser, otpLastSent: new Date() });
      await expect(service.resendOTP(userId)).rejects.toThrow(/Please wait/);
    });
    it('should throw if mail sending fails', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(baseUser);
      mockPrisma.user.update.mockResolvedValue({});
      mockMailService.sendOTPEmail.mockRejectedValueOnce(new Error('fail'));
      await expect(service.resendOTP(userId)).rejects.toThrow('Failed to send verification email. Please try again.');
    });
    it('should resend OTP successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(baseUser);
      mockPrisma.user.update.mockResolvedValue({});
      mockMailService.sendOTPEmail.mockResolvedValue(undefined);
      const result = await service.resendOTP(userId);
      expect(result).toHaveProperty('message');
    });
  });

  // TODO: Add more tests for refresh, error/edge cases, etc.
}); 