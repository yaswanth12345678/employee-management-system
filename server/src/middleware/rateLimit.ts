import type { RequestHandler } from 'express';
import { RateLimitError } from '../common/errors';

interface Bucket {
  count: number;
  resetAt: number;
}

interface RateLimitOptions {
  windowMs: number;
  max: number;
  /** Also key the bucket on this request-body field (e.g. 'email') so one IP can't hammer one account. */
  keyFromBody?: string;
}

/**
 * Hard cap on distinct buckets held in memory. Because the key includes attacker-controlled body
 * material, an unbounded Map would be a memory-exhaustion DoS; once full we evict the oldest entry
 * (Map preserves insertion order) so growth is bounded regardless of key cardinality.
 */
const MAX_BUCKETS = 10_000;

/**
 * Normalize the body-derived key component so that trivial variants of the SAME identity collapse
 * into ONE bucket. The login route validates with Zod `.trim().email()`, so ` victim@x.com`,
 * `victim@x.com `, and `\tvictim@x.com\n` all authenticate against the same account — yet without
 * trimming here each would get its own fresh allowance, defeating the per-account limit. Lowercasing
 * is defense-in-depth: it can only merge buckets (tighten the limit), never split them. Length is
 * capped at the max email length so an attacker can't inflate memory with giant keys.
 */
function normalizeKeyPart(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .slice(0, 254);
}

/**
 * Minimal in-memory fixed-window rate limiter. Suitable for a single-instance deployment; a
 * multi-instance setup would use a shared store (Redis). Throws RateLimitError (429) when exceeded.
 */
export function rateLimit({ windowMs, max, keyFromBody }: RateLimitOptions): RequestHandler {
  const buckets = new Map<string, Bucket>();

  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
  }, windowMs);
  sweep.unref?.();

  return (req, _res, next) => {
    const ip = req.ip ?? 'unknown';
    const extra = keyFromBody
      ? normalizeKeyPart((req.body as Record<string, unknown> | undefined)?.[keyFromBody])
      : '';
    const key = `${ip}:${extra}`;
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      if (!bucket && buckets.size >= MAX_BUCKETS) {
        const oldest = buckets.keys().next().value;
        if (oldest !== undefined) buckets.delete(oldest);
      }
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }
    if (bucket.count >= max) {
      next(new RateLimitError('Too many attempts. Please try again later.'));
      return;
    }
    bucket.count += 1;
    next();
  };
}
