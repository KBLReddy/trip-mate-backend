// src/common/types/jwt-payload.type.ts
export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: string;
}

export interface JwtPayloadWithRefreshToken extends JwtPayload {
  refreshToken: string;
}
