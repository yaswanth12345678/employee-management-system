/**
 * Cross-cutting API envelope + error contract.
 *
 * Every successful response is `{ data }` (plus `{ meta }` for collections).
 * Every failure is `{ error: { code, message, details? } }`.
 * The `code` values map 1:1 to the server's typed error classes.
 */

// ── Success envelopes ──────────────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { pagination: PaginationMeta };
}

// ── Error contract ─────────────────────────────────────────────────────────
export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL';

export interface FieldError {
  field: string;
  message: string;
}

export interface ApiErrorBody {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: FieldError[];
  };
}

// ── Shared query contract for list endpoints ───────────────────────────────
export interface ListQuery {
  page?: number;
  limit?: number;
  /** Format: `field:asc` | `field:desc` (server whitelists sortable fields). */
  sort?: string;
  search?: string;
}
