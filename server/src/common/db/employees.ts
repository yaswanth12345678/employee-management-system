import { pool } from '../../db/pool';

/** Resolve the employee id for a given user id (null if the user has no employee profile). */
export async function findEmployeeIdByUserId(userId: string): Promise<string | null> {
  const { rows } = await pool.query<{ id: string }>('SELECT id FROM employees WHERE user_id = $1', [
    userId,
  ]);
  return rows[0]?.id ?? null;
}
