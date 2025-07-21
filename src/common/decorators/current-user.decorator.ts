// src/common/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../types/jwt-payload.type';

/**
 * Returns the current user from the request. The user is expected to be of type JwtPayload.
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): JwtPayload | undefined => {
    const request = ctx.switchToHttp().getRequest<{ user?: JwtPayload }>();
    const user = request.user;
    return user ?? undefined;
  },
);
