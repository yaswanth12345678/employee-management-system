import type { NotificationDTO, NotificationType, PaginatedResponse } from '@ems/shared';
import { NotFoundError } from '../../common/errors';
import { buildPaginationMeta } from '../../common/http/pagination';
import { emitToUser } from '../../realtime/realtime';
import * as repo from './notifications.repository';
import type { NotificationRow } from './notifications.repository';

function toDTO(row: NotificationRow): NotificationDTO {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    isRead: row.is_read,
    entityType: row.entity_type ?? undefined,
    entityId: row.entity_id ?? undefined,
    createdAt: row.created_at.toISOString(),
    readAt: row.read_at ? row.read_at.toISOString() : undefined,
  };
}

export async function list(
  userId: string,
  page: number,
  limit: number,
  unreadOnly: boolean,
): Promise<PaginatedResponse<NotificationDTO>> {
  const { rows, total } = await repo.list(userId, limit, (page - 1) * limit, unreadOnly);
  return { data: rows.map(toDTO), meta: { pagination: buildPaginationMeta(page, limit, total) } };
}

export function unreadCount(userId: string): Promise<number> {
  return repo.unreadCount(userId);
}

export async function markRead(id: string, userId: string): Promise<void> {
  // Idempotent: marking an already-read (or unknown) notification is a no-op, not an error.
  await repo.markRead(id, userId);
}

export function markAllRead(userId: string): Promise<void> {
  return repo.markAllRead(userId);
}

export async function remove(id: string, userId: string): Promise<void> {
  if (!(await repo.remove(id, userId))) throw new NotFoundError('Notification not found');
}

// ── Emitting notifications (called by other modules as a side effect) ────────
export interface NotifyPayload {
  type: NotificationType;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
}

export async function notifyUser(userId: string, payload: NotifyPayload): Promise<void> {
  const row = await repo.create({ userId, ...payload });
  // Push the new notification live to the user's open sockets (best-effort).
  emitToUser(userId, { type: 'notification', notification: toDTO(row) });
}

/** Notify the user behind a given employee (no-op if the employee has no user). */
export async function notifyEmployee(employeeId: string, payload: NotifyPayload): Promise<void> {
  const userId = await repo.findUserIdByEmployeeId(employeeId);
  if (userId) await notifyUser(userId, payload);
}
