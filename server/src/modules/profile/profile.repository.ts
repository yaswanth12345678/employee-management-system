import { pool } from '../../db/pool';

export interface UpdateProfileFields {
  phone?: string | null;
  dateOfBirth?: string | null;
  avatarUrl?: string | null;
}

const COLUMNS: Record<keyof UpdateProfileFields, string> = {
  phone: 'phone',
  dateOfBirth: 'date_of_birth',
  avatarUrl: 'avatar_url',
};

export async function updateProfile(userId: string, fields: UpdateProfileFields): Promise<boolean> {
  const sets: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  for (const [key, column] of Object.entries(COLUMNS)) {
    const value = fields[key as keyof UpdateProfileFields];
    if (value !== undefined) {
      sets.push(`${column} = $${i++}`);
      values.push(value);
    }
  }
  if (sets.length === 0) return true;
  values.push(userId);
  const { rowCount } = await pool.query(
    `UPDATE employees SET ${sets.join(', ')} WHERE user_id = $${i}`,
    values,
  );
  return (rowCount ?? 0) > 0;
}

export async function getPasswordHash(userId: string): Promise<string | null> {
  const { rows } = await pool.query<{ password_hash: string }>(
    'SELECT password_hash FROM users WHERE id = $1',
    [userId],
  );
  return rows[0]?.password_hash ?? null;
}

export async function updatePasswordHash(userId: string, hash: string): Promise<void> {
  await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, userId]);
}
