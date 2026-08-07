import type { RequestHandler } from 'express';
import { UnauthenticatedError } from '../common/errors';
import { verifyAccessToken } from '../libs/jwt';

/**
 * Verifies the `Authorization: Bearer <token>` access token and attaches `req.user`.
 * Any route mounted behind this middleware is guaranteed a valid, non-expired token — so
 * controllers never re-check auth. Failures become a 401 via the central error handler.
 */
export const authenticate: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    next(new UnauthenticatedError('Missing or malformed Authorization header'));
    return;
  }

  const token = header.slice('Bearer '.length);

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(new UnauthenticatedError('Invalid or expired access token'));
  }
};
