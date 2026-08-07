import type { NotificationType } from '../enums';

export interface NotificationDTO {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  entityType?: string;
  entityId?: string;
  createdAt: string;
  readAt?: string;
}

export interface UnreadCountDTO {
  count: number;
}
