import { JwtRefreshStrategy } from '../../src/auth/strategies/jwt-refresh.strategy';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../../src/common/types/jwt-payload.type';

const mockConfigService = {
  get: jest.fn((key) => {
    if (key === 'JWT_REFRESH_SECRET') return 'test_refresh_secret';
    return null;
  }),
};

describe('JwtRefreshStrategy', () => {
  let strategy: JwtRefreshStrategy;

  beforeEach(() => {
    jest.clearAllMocks();
    strategy = new JwtRefreshStrategy(mockConfigService as any);
  });

  it('should return payload with refreshToken if Authorization header is present', async () => {
    const req = { get: jest.fn().mockReturnValue('Bearer refresh_token') };
    const payload = { sub: 'user1', email: 'test1@example.com', role: 'USER' };
    const result = strategy.validate(req as any, payload);
    expect(result).toEqual({ ...payload, refreshToken: 'refresh_token' });
  });

  it('should return payload with undefined refreshToken if Authorization header is missing', async () => {
    const req = { get: jest.fn().mockReturnValue(undefined) };
    const payload = { sub: 'user2', email: 'test2@example.com', role: 'USER' };
    const result = strategy.validate(req as any, payload);
    expect(result).toEqual({ ...payload, refreshToken: undefined });
  });

  it('should propagate error if thrown', async () => {
    const req = null;
    const payload = { sub: 'user3', email: 'test3@example.com', role: 'USER' };
    expect(() => strategy.validate(req as any, payload)).toThrow();
  });
}); 