import { JwtStrategy } from '../../src/auth/strategies/jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../src/users/users.service';
import { JwtPayload } from '../../src/common/types/jwt-payload.type';

const mockConfigService = {
  get: jest.fn((key) => {
    if (key === 'JWT_SECRET') return 'test_jwt_secret';
    return null;
  }),
};

const mockUsersService = {
  findById: jest.fn(),
};

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(() => {
    jest.clearAllMocks();
    strategy = new JwtStrategy(
      mockConfigService as any,
      mockUsersService as any,
    );
  });

  it('should return user if found', async () => {
    const payload = { sub: 'user1', email: 'test1@example.com', role: 'USER' };
    const user = { id: 'user1', name: 'Test' };
    mockUsersService.findById.mockResolvedValue(user);
    await expect(strategy.validate(payload)).resolves.toEqual(user);
  });

  it('should throw if user not found', async () => {
    const payload = { sub: 'user2', email: 'test2@example.com', role: 'USER' };
    mockUsersService.findById.mockResolvedValue(null);
    await expect(strategy.validate(payload)).rejects.toThrow('Unauthorized');
  });

  it('should propagate exception from usersService', async () => {
    const payload = { sub: 'user3', email: 'test3@example.com', role: 'USER' };
    mockUsersService.findById.mockRejectedValue(new Error('DB error'));
    await expect(strategy.validate(payload)).rejects.toThrow('DB error');
  });
}); 