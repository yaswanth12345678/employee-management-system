import { Router } from 'express';
import { asyncHandler } from '../../common/http/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import * as controller from './notifications.controller';

/** Every route operates on the CURRENT user's notifications only (scoped in the repository). */
export const notificationsRouter = Router();

notificationsRouter.use(authenticate);

notificationsRouter.get('/', asyncHandler(controller.list));
notificationsRouter.get('/unread-count', asyncHandler(controller.unreadCount));
notificationsRouter.patch('/read-all', asyncHandler(controller.markAllRead));
notificationsRouter.patch('/:id/read', asyncHandler(controller.markRead));
notificationsRouter.delete('/:id', asyncHandler(controller.remove));
