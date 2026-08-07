import type { ApiErrorCode, FieldError } from '@ems/shared';

/**
 * Base class for every EXPECTED (operational) error in the app.
 *
 * Each subclass carries the HTTP status and the machine-readable `code` that the central
 * error handler will turn into the `{ error: { code, message, details } }` envelope.
 * `isOperational = true` marks "this is a handled business condition, not a bug" — the
 * error handler uses it to decide log level and whether to hide the message in production.
 */
export abstract class AppError extends Error {
  abstract readonly statusCode: number;
  abstract readonly code: ApiErrorCode;
  readonly isOperational = true;
  readonly details?: FieldError[];

  constructor(message: string, details?: FieldError[]) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
    // Keep clean stack traces pointing at the throw site (V8 only).
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  readonly statusCode = 400;
  readonly code: ApiErrorCode = 'VALIDATION_ERROR';
  constructor(message = 'Validation failed', details?: FieldError[]) {
    super(message, details);
  }
}

export class UnauthenticatedError extends AppError {
  readonly statusCode = 401;
  readonly code: ApiErrorCode = 'UNAUTHENTICATED';
  constructor(message = 'Authentication required') {
    super(message);
  }
}

export class ForbiddenError extends AppError {
  readonly statusCode = 403;
  readonly code: ApiErrorCode = 'FORBIDDEN';
  constructor(message = 'You do not have permission to perform this action') {
    super(message);
  }
}

export class NotFoundError extends AppError {
  readonly statusCode = 404;
  readonly code: ApiErrorCode = 'NOT_FOUND';
  constructor(message = 'Resource not found') {
    super(message);
  }
}

export class ConflictError extends AppError {
  readonly statusCode = 409;
  readonly code: ApiErrorCode = 'CONFLICT';
  constructor(message = 'Resource conflict') {
    super(message);
  }
}

export class RateLimitError extends AppError {
  readonly statusCode = 429;
  readonly code: ApiErrorCode = 'RATE_LIMITED';
  constructor(message = 'Too many requests') {
    super(message);
  }
}
