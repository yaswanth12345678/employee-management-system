import { Pool } from 'pg';
import { env } from '../config/env';
import { logger } from '../libs/logger';

/**
 * A single shared connection Pool for the whole process.
 *
 * Why a pool (and only one)? Opening a TCP+auth connection to Postgres per request is
 * slow and quickly exhausts the database's connection slots. The pool keeps a small set
 * of connections open and hands them out, reused, on demand. Repositories acquire a
 * client from this pool; they never `new Pool()` themselves.
 */
export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: env.PG_POOL_MAX,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

// A connection can drop while idle (network blip, DB restart). Log it instead of crashing.
pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected error on idle PostgreSQL client');
});

/** Cheap readiness probe used by the health endpoint. Throws if the DB is unreachable. */
export async function pingDatabase(): Promise<void> {
  await pool.query('SELECT 1');
}
