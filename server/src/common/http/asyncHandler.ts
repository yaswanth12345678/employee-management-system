import type { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * Wraps an async route handler so any rejected promise is forwarded to Express's
 * error pipeline via `next(err)` — which lands in our central error handler.
 *
 * Why this exists: Express 4 does NOT catch errors thrown from async handlers. Without
 * this wrapper, every controller would need its own try/catch, and one forgotten catch
 * becomes an unhandled rejection that hangs the request. One tiny helper removes that
 * entire class of bug.
 */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };
