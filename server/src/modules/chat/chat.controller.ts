import type { Request, Response } from 'express';
import type { ApiResponse, ChatConversationDTO, ChatMessageDTO, ChatPeerDTO, ChatUnreadCountDTO } from '@ems/shared';
import { parseWith } from '../../common/validation/parse';
import * as service from './chat.service';
import {
  conversationIdParamsSchema,
  listMessagesQuerySchema,
  sendMessageSchema,
  startConversationSchema,
} from './chat.validation';

export async function listPeers(req: Request, res: Response): Promise<void> {
  const data = await service.listPeers(req.user!.id);
  res.status(200).json({ data } satisfies ApiResponse<ChatPeerDTO[]>);
}

export async function listConversations(req: Request, res: Response): Promise<void> {
  const data = await service.listConversations(req.user!.id);
  res.status(200).json({ data } satisfies ApiResponse<ChatConversationDTO[]>);
}

export async function startConversation(req: Request, res: Response): Promise<void> {
  const { peerUserId } = parseWith(startConversationSchema, req.body);
  const data = await service.startConversation(req.user!.id, peerUserId);
  res.status(200).json({ data } satisfies ApiResponse<ChatConversationDTO>);
}

export async function listMessages(req: Request, res: Response): Promise<void> {
  const { id } = parseWith(conversationIdParamsSchema, req.params);
  const { page, limit } = parseWith(listMessagesQuerySchema, req.query);
  res.status(200).json(await service.listMessages(req.user!.id, id, page, limit));
}

export async function sendMessage(req: Request, res: Response): Promise<void> {
  const { id } = parseWith(conversationIdParamsSchema, req.params);
  const { body } = parseWith(sendMessageSchema, req.body);
  const data = await service.sendMessage(req.user!.id, id, body);
  res.status(201).json({ data } satisfies ApiResponse<ChatMessageDTO>);
}

export async function markRead(req: Request, res: Response): Promise<void> {
  const { id } = parseWith(conversationIdParamsSchema, req.params);
  await service.markRead(req.user!.id, id);
  res.status(204).send();
}

export async function unreadCount(req: Request, res: Response): Promise<void> {
  const count = await service.unreadCount(req.user!.id);
  res.status(200).json({ data: { count } } satisfies ApiResponse<ChatUnreadCountDTO>);
}
