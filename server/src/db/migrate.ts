import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pool } from './pool';
import { logger } from '../libs/logger';

/**
 * A minimal, transactional migration runner.
 *
 * Each `.sql` file in `server/db/migrations` (kept OUTSIDE src/ so the schema is easy to find and
 * run by hand) is applied exactly once, in filename order, inside a transaction. Applied filenames
 * are recorded in `schema_migrations`, so re-running is safe (already-applied files are skipped). If
 * any statement in a file fails, that file's whole transaction is rolled back — you never end up in
 * a half-migrated state.
 */
// This file lives at server/src/db/; the SQL lives at server/db/migrations → up two, then db/migrations.
const MIGRATIONS_DIR = join(__dirname, '..', '..', 'db', 'migrations');

async function ensureMigrationsTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename   TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

async function getApplied(): Promise<Set<string>> {
  const { rows } = await pool.query<{ filename: string }>('SELECT filename FROM schema_migrations');
  return new Set(rows.map((r) => r.filename));
}

async function run(): Promise<void> {
  await ensureMigrationsTable();
  const applied = await getApplied();

  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('.sql')).sort();
  const pending = files.filter((f) => !applied.has(f));

  if (pending.length === 0) {
    logger.info('No pending migrations — database is up to date.');
    return;
  }

  for (const file of pending) {
    const sql = await readFile(join(MIGRATIONS_DIR, file), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
      await client.query('COMMIT');
      logger.info(`✔ applied migration: ${file}`);
    } catch (err) {
      await client.query('ROLLBACK');
      logger.error({ err, file }, 'migration failed — rolled back');
      throw err;
    } finally {
      client.release();
    }
  }

  logger.info(`Done. Applied ${pending.length} migration(s).`);
}

run()
  .then(() => pool.end())
  .catch((err) => {
    logger.error({ err }, 'Migration run aborted.');
    void pool.end().finally(() => process.exit(1));
  });
