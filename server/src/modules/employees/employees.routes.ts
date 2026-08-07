import { Router } from 'express';
import { asyncHandler } from '../../common/http/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { createEmployeeSchema, updateEmployeeSchema } from './employees.validation';
import * as controller from './employees.controller';

/**
 * Employee routes. All require authentication; writes require admin/hr, delete requires admin.
 */
export const employeesRouter = Router();

employeesRouter.use(authenticate);

employeesRouter.get('/', asyncHandler(controller.list));
employeesRouter.get('/:id', asyncHandler(controller.getById));
employeesRouter.post(
  '/',
  authorize('admin', 'hr'),
  validate(createEmployeeSchema),
  asyncHandler(controller.create),
);
employeesRouter.patch(
  '/:id',
  authorize('admin', 'hr'),
  validate(updateEmployeeSchema),
  asyncHandler(controller.update),
);
employeesRouter.delete('/:id', authorize('admin'), asyncHandler(controller.remove));
