import type { ErrorRequestHandler } from 'express';
import type { ApiErrorBody } from '@ems/shared';
import { AppError } from '../common/errors';
import { logger } from '../libs/logger';
import { env } from '../config/env';

/**
 * The ONE place errors become HTTP responses.
 *
 * Express recognises this as an error handler because it has four parameters. It must be
 * registered LAST (after all routes). Two paths:
 *   • Known AppError  → use its statusCode + code + message + details.
 *   • Anything else   → a bug: log with full stack, return a generic 500 and NEVER leak
 *                        internals to the client in production.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    // 5xx are our fault; 4xx are the caller's. Log accordingly.
    if (err.statusCode >= 500) {
      logger.error({ err, code: err.code }, err.message);
    } else {
      logger.warn({ code: err.code }, err.message);
    }

    const body: ApiErrorBody = {
      error: { code: err.code, message: err.message, details: err.details },
    };
    res.status(err.statusCode).json(body);
    return;
  }

  // Unexpected / programmer error.
  logger.error({ err }, 'Unhandled error');

  const body: ApiErrorBody = {
    error: {
      code: 'INTERNAL',
      message:
        env.NODE_ENV === 'production'
          ? 'An unexpected error occurred'
          : ((err as Error)?.message ?? 'Unknown error'),
    },
  };
  res.status(500).json(body);
};
