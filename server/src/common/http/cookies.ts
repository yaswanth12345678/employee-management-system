import type { Response } from 'express';
import { env } from '../../config/env';

/**
 * Centralized refresh-token cookie handling, so "set" and "clear" always use identical
 * attributes (a mismatch is a classic bug — a cookie set with one path can't be cleared with
 * another).
 *
 * Security attributes:
 *   • httpOnly  — JavaScript can't read it, so XSS can't steal the refresh token.
 *   • secure    — HTTPS-only (disabled in dev so localhost http works).
 *   • sameSite  — 'lax' blocks the cookie on cross-site POSTs (CSRF defense).
 *   • path      — scoped to the auth routes, so it's only ever sent where it's needed.
 */
export const REFRESH_COOKIE_NAME = 'refresh_token';
const REFRESH_COOKIE_PATH = '/api/v1/auth';
const REFRESH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: REFRESH_COOKIE_PATH,
    maxAge: REFRESH_MAX_AGE_MS,
  });
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_PATH });
}
