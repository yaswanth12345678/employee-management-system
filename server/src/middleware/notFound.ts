import type { RequestHandler } from 'express';
import { NotFoundError } from '../common/errors';

/**
 * Catch-all for any request that matched no route. Instead of Express's default HTML
 * 404 page, we hand a typed NotFoundError to the central error handler so unknown routes
 * return the same JSON error envelope as everything else. Registered just before errorHandler.
 */
export const notFound: RequestHandler = (req, _res, next) => {
  next(new NotFoundError(`Route not found: ${req.method} ${req.originalUrl}`));
};
