import type { RoleName } from '@ems/shared';
import { pool } from '../../db/pool';

/**
 * Data-access layer for auth. The ONLY place auth-related SQL lives. Returns raw DB rows
 * (snake_case); the service maps them to camelCase DTOs. Business rules do NOT belong here.
 */
export interface AuthUserRow {
  id: string;
  email: string;
  password_hash: string;
  role_name: RoleName;
  is_active: boolean;
  token_version: number;
  employee_id: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

// Shared projection so findByEmail and findById return identical shapes.
const USER_SELECT = `
  SELECT u.id, u.email, u.password_hash, r.name AS role_name, u.is_active, u.token_version,
         e.id AS employee_id, e.first_name, e.last_name, e.avatar_url
  FROM users u
  JOIN roles r ON r.id = u.role_id
  LEFT JOIN employees e ON e.user_id = u.id
`;

export async function findUserByEmail(email: string): Promise<AuthUserRow | null> {
  const { rows } = await pool.query<AuthUserRow>(`${USER_SELECT} WHERE u.email = $1`, [email]);
  return rows[0] ?? null;
}

export async function findUserById(id: string): Promise<AuthUserRow | null> {
  const { rows } = await pool.query<AuthUserRow>(`${USER_SELECT} WHERE u.id = $1`, [id]);
  return rows[0] ?? null;
}

export async function updateLastLogin(id: string): Promise<void> {
  await pool.query('UPDATE users SET last_login_at = now() WHERE id = $1', [id]);
}

/** Invalidate all existing refresh tokens for a user (logout / password change / reset). */
export async function bumpTokenVersion(userId: string): Promise<void> {
  await pool.query('UPDATE users SET token_version = token_version + 1 WHERE id = $1', [userId]);
}

// ── Password reset ────────────────────────────────────────────────────────
export async function findUserIdByEmail(email: string): Promise<string | null> {
  const { rows } = await pool.query<{ id: string }>('SELECT id FROM users WHERE email = $1', [email]);
  return rows[0]?.id ?? null;
}

export async function createResetToken(
  userId: string,
  tokenHash: string,
  expiresAt: Date,
): Promise<void> {
  await pool.query(
    'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [userId, tokenHash, expiresAt],
  );
}

export async function findValidResetToken(
  tokenHash: string,
): Promise<{ id: string; userId: string } | null> {
  const { rows } = await pool.query<{ id: string; user_id: string }>(
    `SELECT id, user_id FROM password_reset_tokens
     WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now()`,
    [tokenHash],
  );
  return rows[0] ? { id: rows[0].id, userId: rows[0].user_id } : null;
}

export async function markResetTokenUsed(id: string): Promise<void> {
  await pool.query('UPDATE password_reset_tokens SET used_at = now() WHERE id = $1', [id]);
}

export async function setPassword(userId: string, passwordHash: string): Promise<void> {
  await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, userId]);
}
