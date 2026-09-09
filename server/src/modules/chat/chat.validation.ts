import { z } from 'zod';

export const listMessagesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const startConversationSchema = z.object({
  peerUserId: z.string().uuid(),
});

export const sendMessageSchema = z.object({
  body: z.string().trim().min(1).max(4000),
});

export const conversationIdParamsSchema = z.object({
  id: z.string().uuid(),
});
