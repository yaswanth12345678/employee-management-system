import { Router } from 'express';
import { asyncHandler } from '../../common/http/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import * as controller from './chat.controller';
import { sendMessageSchema, startConversationSchema } from './chat.validation';

export const chatRouter = Router();

chatRouter.use(authenticate);

chatRouter.get('/peers', asyncHandler(controller.listPeers));
chatRouter.get('/conversations', asyncHandler(controller.listConversations));
chatRouter.post(
  '/conversations',
  validate(startConversationSchema),
  asyncHandler(controller.startConversation),
);
chatRouter.get('/conversations/:id/messages', asyncHandler(controller.listMessages));
chatRouter.post(
  '/conversations/:id/messages',
  validate(sendMessageSchema),
  asyncHandler(controller.sendMessage),
);
chatRouter.patch('/conversations/:id/read', asyncHandler(controller.markRead));
chatRouter.get('/unread-count', asyncHandler(controller.unreadCount));
