import type { Request, Response } from 'express';
import type { ApiResponse, UnreadCountDTO } from '@ems/shared';
import { parseWith } from '../../common/validation/parse';
import * as service from './notifications.service';
import { listNotificationsQuerySchema } from './notifications.validation';

export async function list(req: Request, res: Response): Promise<void> {
  const { page, limit, unreadOnly } = parseWith(listNotificationsQuerySchema, req.query);
  res.status(200).json(await service.list(req.user!.id, page, limit, unreadOnly));
}

export async function unreadCount(req: Request, res: Response): Promise<void> {
  const count = await service.unreadCount(req.user!.id);
  res.status(200).json({ data: { count } } satisfies ApiResponse<UnreadCountDTO>);
}

export async function markRead(req: Request, res: Response): Promise<void> {
  await service.markRead(req.params.id, req.user!.id);
  res.status(204).send();
}

export async function markAllRead(req: Request, res: Response): Promise<void> {
  await service.markAllRead(req.user!.id);
  res.status(204).send();
}

export async function remove(req: Request, res: Response): Promise<void> {
  await service.remove(req.params.id, req.user!.id);
  res.status(204).send();
}
