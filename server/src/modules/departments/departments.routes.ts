import { Router } from 'express';
import { asyncHandler } from '../../common/http/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { createDepartmentSchema, updateDepartmentSchema } from './departments.validation';
import * as controller from './departments.controller';

/**
 * Department routes. `router.use(authenticate)` applies to ALL routes below — every department
 * endpoint requires a valid session. Writes additionally require a role (RBAC):
 *   read (list/get) → any authenticated user
 *   create/update   → admin or hr
 *   delete          → admin only
 */
export const departmentsRouter = Router();

departmentsRouter.use(authenticate);

departmentsRouter.get('/', asyncHandler(controller.list));
departmentsRouter.get('/:id', asyncHandler(controller.getById));
departmentsRouter.post(
  '/',
  authorize('admin', 'hr'),
  validate(createDepartmentSchema),
  asyncHandler(controller.create),
);
departmentsRouter.patch(
  '/:id',
  authorize('admin', 'hr'),
  validate(updateDepartmentSchema),
  asyncHandler(controller.update),
);
departmentsRouter.delete('/:id', authorize('admin'), asyncHandler(controller.remove));
