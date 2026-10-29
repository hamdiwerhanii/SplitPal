import type { Request } from 'express';

export type JwtPayload = {
  sub: string;
  email: string;
};

export type AuthenticatedRequest = Request & { user: JwtPayload };

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};
