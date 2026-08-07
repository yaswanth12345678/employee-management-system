import { Router } from 'express';
import { asyncHandler } from '../../common/http/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import {
  createCommentSchema,
  createTaskSchema,
  updateStatusSchema,
  updateTaskSchema,
} from './tasks.validation';
import * as controller from './tasks.controller';

export const tasksRouter = Router();

tasksRouter.use(authenticate);

tasksRouter.get('/', asyncHandler(controller.list));
tasksRouter.get('/:id', asyncHandler(controller.getById));
tasksRouter.post('/', authorize('admin', 'manager'), validate(createTaskSchema), asyncHandler(controller.create));
tasksRouter.patch('/:id', authorize('admin', 'manager'), validate(updateTaskSchema), asyncHandler(controller.update));
// Quick status change (board drag-drop) — any authenticated user.
tasksRouter.patch('/:id/status', validate(updateStatusSchema), asyncHandler(controller.updateStatus));
tasksRouter.delete('/:id', authorize('admin', 'manager'), asyncHandler(controller.remove));

// Comments (nested under a task; mutations are author-or-admin, enforced in the service)
tasksRouter.get('/:id/comments', asyncHandler(controller.listComments));
tasksRouter.post('/:id/comments', validate(createCommentSchema), asyncHandler(controller.addComment));
tasksRouter.patch('/:id/comments/:commentId', validate(createCommentSchema), asyncHandler(controller.updateComment));
tasksRouter.delete('/:id/comments/:commentId', asyncHandler(controller.removeComment));
