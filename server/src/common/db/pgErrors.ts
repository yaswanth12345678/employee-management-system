import type { AppError } from '../errors';

/**
 * PostgreSQL error-code helpers. The DB is the last line of defense for integrity; services
 * catch these codes and translate them into meaningful HTTP errors instead of leaking raw
 * driver errors. Codes are from the SQLSTATE spec.
 */
export const PG_ERROR = {
  UNIQUE_VIOLATION: '23505',
  FOREIGN_KEY_VIOLATION: '23503',
  CHECK_VIOLATION: '23514',
} as const;

export function pgErrorCode(err: unknown): string | undefined {
  return typeof err === 'object' && err !== null ? (err as { code?: string }).code : undefined;
}

/**
 * Translate a caught PostgreSQL constraint error into a domain AppError. Provide a factory per
 * SQLSTATE code you expect; an unrecognized error is re-thrown unchanged. It ALWAYS throws (returns
 * `never`), so a catch block reads as a single declarative mapping instead of repeated if/switch:
 *
 *   } catch (err) {
 *     mapConstraint(err, {
 *       [PG_ERROR.UNIQUE_VIOLATION]: () => new ConflictError('…already exists'),
 *       [PG_ERROR.FOREIGN_KEY_VIOLATION]: () => new ValidationError('…does not exist'),
 *     });
 *   }
 */
export function mapConstraint(err: unknown, map: Partial<Record<string, () => AppError>>): never {
  const make = map[pgErrorCode(err) ?? ''];
  if (make) throw make();
  throw err;
}
