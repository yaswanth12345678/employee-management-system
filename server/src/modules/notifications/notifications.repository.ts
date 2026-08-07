import type { NotificationType } from '@ems/shared';
import { pool } from '../../db/pool';

export interface NotificationRow {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  entity_type: string | null;
  entity_id: string | null;
  created_at: Date;
  read_at: Date | null;
}

export interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: string | null;
  entityId?: string | null;
}

export async function list(
  userId: string,
  limit: number,
  offset: number,
  unreadOnly: boolean,
): Promise<{ rows: NotificationRow[]; total: number }> {
  const filter = unreadOnly ? 'AND is_read = FALSE' : '';
  const [listResult, countResult] = await Promise.all([
    pool.query<NotificationRow>(
      `SELECT id, type, title, message, is_read, entity_type, entity_id, created_at, read_at
       FROM notifications WHERE user_id = $1 ${filter}
       ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [userId, limit, offset],
    ),
    pool.query<{ total: number }>(
      `SELECT COUNT(*)::int AS total FROM notifications WHERE user_id = $1 ${filter}`,
      [userId],
    ),
  ]);
  return { rows: listResult.rows, total: countResult.rows[0].total };
}

export async function unreadCount(userId: string): Promise<number> {
  const { rows } = await pool.query<{ count: number }>(
    'SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND is_read = FALSE',
    [userId],
  );
  return rows[0].count;
}

export async function markRead(id: string, userId: string): Promise<boolean> {
  const { rowCount } = await pool.query(
    `UPDATE notifications SET is_read = TRUE, read_at = now()
     WHERE id = $1 AND user_id = $2 AND is_read = FALSE`,
    [id, userId],
  );
  return (rowCount ?? 0) > 0;
}

export async function markAllRead(userId: string): Promise<void> {
  await pool.query(
    'UPDATE notifications SET is_read = TRUE, read_at = now() WHERE user_id = $1 AND is_read = FALSE',
    [userId],
  );
}

export async function remove(id: string, userId: string): Promise<boolean> {
  const { rowCount } = await pool.query('DELETE FROM notifications WHERE id = $1 AND user_id = $2', [
    id,
    userId,
  ]);
  return (rowCount ?? 0) > 0;
}

export async function create(data: CreateNotificationData): Promise<NotificationRow> {
  const { rows } = await pool.query<NotificationRow>(
    `INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, type, title, message, is_read, entity_type, entity_id, created_at, read_at`,
    [data.userId, data.type, data.title, data.message, data.entityType ?? null, data.entityId ?? null],
  );
  return rows[0];
}

export async function findUserIdByEmployeeId(employeeId: string): Promise<string | null> {
  const { rows } = await pool.query<{ user_id: string }>(
    'SELECT user_id FROM employees WHERE id = $1',
    [employeeId],
  );
  return rows[0]?.user_id ?? null;
}
