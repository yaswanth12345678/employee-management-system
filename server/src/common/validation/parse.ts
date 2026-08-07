import { z, type ZodType } from 'zod';
import { ValidationError } from '../errors';

/**
 * Parse `data` against a zod schema, throwing our typed `ValidationError` (→ 400 with per-field
 * details) on failure. One helper used by both the `validate` middleware (for bodies) and
 * controllers (for query params), so ALL validation produces the identical error contract.
 *
 * We infer the schema's OUTPUT type (`z.infer<S>`), so fields with `.default()`/`.coerce`
 * come back as their resolved types (e.g. a defaulted `page` is `number`, not `number | undefined`).
 */
export function parseWith<S extends ZodType>(schema: S, data: unknown): z.infer<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.join('.') || '(root)',
      message: issue.message,
    }));
    throw new ValidationError('Validation failed', details);
  }
  return result.data;
}
