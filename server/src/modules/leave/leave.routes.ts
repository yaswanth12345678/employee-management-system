import { Router } from 'express';
import { asyncHandler } from '../../common/http/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { createLeaveSchema } from './leave.validation';
import * as controller from './leave.controller';

/**
 * Leave requests are a STATE MACHINE, so transitions are explicit action endpoints (not a raw
 * PATCH of `status`). This is where per-transition authorization lives: anyone can apply/cancel
 * their own; only managers/HR/admin can approve or reject.
 */
export const leaveRouter = Router();

leaveRouter.use(authenticate);

leaveRouter.get('/', asyncHandler(controller.list));
leaveRouter.post('/', validate(createLeaveSchema), asyncHandler(controller.apply));
leaveRouter.patch('/:id/approve', authorize('admin', 'hr', 'manager'), asyncHandler(controller.approve));
leaveRouter.patch('/:id/reject', authorize('admin', 'hr', 'manager'), asyncHandler(controller.reject));
leaveRouter.patch('/:id/cancel', asyncHandler(controller.cancel));
