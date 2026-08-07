import jwt, { type SignOptions } from 'jsonwebtoken';
import type { RoleName } from '@ems/shared';
import { env } from '../config/env';

/**
 * JWT signing/verification wrapper.
 *
 * Two token types with SEPARATE secrets:
 *   • access  — short-lived (~15m), sent as `Authorization: Bearer`, carries the role so the
 *               authorize middleware can do RBAC without a DB hit.
 *   • refresh — long-lived (~7d), lives in an httpOnly cookie, used ONLY to mint new access
 *               tokens. Separate secret so a leaked access token can't be replayed as a refresh.
 */
export interface AccessTokenPayload {
  sub: string; // user id
  role: RoleName;
  type: 'access';
  exp?: number; // expiry (epoch seconds), set by jsonwebtoken from expiresIn
}

export interface RefreshTokenPayload {
  sub: string;
  type: 'refresh';
  tv: number; // token version — must match users.token_version to be accepted
}

export function signAccessToken(userId: string, role: RoleName): string {
  const options = { subject: userId, expiresIn: env.JWT_ACCESS_TTL } as SignOptions;
  return jwt.sign({ role, type: 'access' }, env.JWT_ACCESS_SECRET, options);
}

export function signRefreshToken(userId: string, tokenVersion: number): string {
  const options = { subject: userId, expiresIn: env.JWT_REFRESH_TTL } as SignOptions;
  return jwt.sign({ type: 'refresh', tv: tokenVersion }, env.JWT_REFRESH_SECRET, options);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as unknown as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as unknown as RefreshTokenPayload;
}
