import { RolesGuard } from '../../src/auth/guards/roles.guard';
import { Reflector } from '@nestjs/core';

const mockExecutionContext = (userRole: string) => ({
  switchToHttp: () => ({ getRequest: () => ({ user: { role: userRole } }) }),
  getHandler: () => ({}),
  getClass: () => ({}),
} as any);

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() } as any;
    guard = new RolesGuard(reflector);
  });

  it('should allow if no required roles', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);
    const context = mockExecutionContext('USER');
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow if user has required role', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['ADMIN', 'USER']);
    const context = mockExecutionContext('USER');
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny if user does not have required role', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(['ADMIN']);
    const context = mockExecutionContext('USER');
    expect(guard.canActivate(context)).toBe(false);
  });
}); 