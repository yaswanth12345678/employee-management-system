import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { parseWith } from '../src/common/validation/parse';
import { buildPaginationMeta } from '../src/common/http/pagination';
import { pgErrorCode, PG_ERROR, mapConstraint } from '../src/common/db/pgErrors';
import {
  AppError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../src/common/errors';

describe('parseWith', () => {
  const schema = z.object({ page: z.coerce.number().int().min(1).default(1), name: z.string() });

  it('parses and coerces valid input (default applied)', () => {
    const result = parseWith(schema, { name: 'x' });
    expect(result).toEqual({ page: 1, name: 'x' });
  });

  it('throws a ValidationError with field details on invalid input', () => {
    try {
      parseWith(schema, { page: 0 });
      throw new Error('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      const details = (err as ValidationError).details ?? [];
      expect(details.some((d) => d.field === 'name')).toBe(true);
    }
  });
});

describe('buildPaginationMeta', () => {
  it('computes totalPages', () => {
    expect(buildPaginationMeta(1, 10, 25)).toEqual({ page: 1, limit: 10, total: 25, totalPages: 3 });
  });
  it('returns 0 totalPages for an empty set', () => {
    expect(buildPaginationMeta(1, 10, 0).totalPages).toBe(0);
  });
});

describe('pgErrorCode', () => {
  it('extracts a pg error code', () => {
    expect(pgErrorCode({ code: PG_ERROR.UNIQUE_VIOLATION })).toBe('23505');
    expect(pgErrorCode(new Error('x'))).toBeUndefined();
    expect(pgErrorCode(null)).toBeUndefined();
  });
});

describe('mapConstraint', () => {
  it('throws the mapped error for a recognized code', () => {
    expect(() =>
      mapConstraint({ code: PG_ERROR.UNIQUE_VIOLATION }, {
        [PG_ERROR.UNIQUE_VIOLATION]: () => new ConflictError('dup'),
      }),
    ).toThrow(ConflictError);
  });

  it('re-throws the original error when the code is unmapped', () => {
    const original = { code: PG_ERROR.CHECK_VIOLATION };
    expect(() =>
      mapConstraint(original, { [PG_ERROR.UNIQUE_VIOLATION]: () => new ConflictError('dup') }),
    ).toThrow(); // not a ConflictError — the raw error bubbles up
    try {
      mapConstraint(original, { [PG_ERROR.UNIQUE_VIOLATION]: () => new ConflictError('dup') });
    } catch (err) {
      expect(err).toBe(original);
    }
  });

  it('re-throws non-pg errors unchanged', () => {
    const plain = new Error('boom');
    try {
      mapConstraint(plain, { [PG_ERROR.UNIQUE_VIOLATION]: () => new ConflictError('dup') });
    } catch (err) {
      expect(err).toBe(plain);
    }
  });
});

describe('AppError hierarchy', () => {
  it('maps subclasses to the right status and code', () => {
    expect(new ValidationError().statusCode).toBe(400);
    expect(new ForbiddenError().statusCode).toBe(403);
    expect(new NotFoundError().statusCode).toBe(404);
    expect(new ConflictError().statusCode).toBe(409);
    expect(new NotFoundError()).toBeInstanceOf(AppError);
    expect(new ForbiddenError().code).toBe('FORBIDDEN');
  });
});
