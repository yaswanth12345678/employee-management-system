import { pool } from './pool';
import { env } from '../config/env';
import { hashPassword } from '../libs/password';
import { logger } from '../libs/logger';

/**
 * Idempotent development seed: creates a first admin user + employee profile so you can log in.
 * Runs in a transaction. Safe to run repeatedly — it skips if the admin already exists.
 *
 * Override defaults via SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD (validated in config/env.ts).
 */
const ADMIN_EMAIL = env.SEED_ADMIN_EMAIL;
const ADMIN_PASSWORD = env.SEED_ADMIN_PASSWORD;

async function seed(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: roleRows } = await client.query<{ id: string }>(
      `SELECT id FROM roles WHERE name = 'admin'`,
    );
    if (roleRows.length === 0) {
      throw new Error("Role 'admin' not found — run `npm run migrate` first.");
    }
    const adminRoleId = roleRows[0].id;

    const { rows: existing } = await client.query(`SELECT id FROM users WHERE email = $1`, [
      ADMIN_EMAIL,
    ]);
    if (existing.length > 0) {
      logger.info(`Admin user ${ADMIN_EMAIL} already exists — skipping.`);
      await client.query('COMMIT');
      return;
    }

    const passwordHash = await hashPassword(ADMIN_PASSWORD);
    const { rows: userRows } = await client.query<{ id: string }>(
      `INSERT INTO users (email, password_hash, role_id) VALUES ($1, $2, $3) RETURNING id`,
      [ADMIN_EMAIL, passwordHash, adminRoleId],
    );
    const userId = userRows[0].id;

    await client.query(
      `INSERT INTO employees (user_id, employee_code, first_name, last_name, status, hire_date)
       VALUES ($1, $2, $3, $4, 'active', CURRENT_DATE)`,
      [userId, 'EMP-00001', 'System', 'Administrator'],
    );
    await client.query(`INSERT INTO user_settings (user_id) VALUES ($1) ON CONFLICT DO NOTHING`, [
      userId,
    ]);

    await client.query('COMMIT');
    // Never log the password — only confirm which account was created.
    logger.info(`Seeded admin user → email: ${ADMIN_EMAIL}`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error({ err }, 'Seed failed');
    process.exit(1);
  });
