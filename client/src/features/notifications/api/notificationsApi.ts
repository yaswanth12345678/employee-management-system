import type {
  ApiResponse,
  NotificationDTO,
  PaginatedResponse,
  UnreadCountDTO,
} from '@ems/shared';
import { httpClient } from '../../../lib/http';

export async function list(page: number, limit: number, unreadOnly: boolean): Promise<PaginatedResponse<NotificationDTO>> {
  const { data } = await httpClient.get<PaginatedResponse<NotificationDTO>>('/notifications', {
    params: { page, limit, unreadOnly },
  });
  return data;
}

export async function unreadCount(): Promise<number> {
  const { data } = await httpClient.get<ApiResponse<UnreadCountDTO>>('/notifications/unread-count');
  return data.data.count;
}

export async function markRead(id: string): Promise<void> {
  await httpClient.patch(`/notifications/${id}/read`);
}

export async function markAllRead(): Promise<void> {
  await httpClient.patch('/notifications/read-all');
}

export async function remove(id: string): Promise<void> {
  await httpClient.delete(`/notifications/${id}`);
}
