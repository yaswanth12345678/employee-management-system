import { Router } from 'express';
import { asyncHandler } from '../../common/http/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { addMemberSchema, createProjectSchema, updateProjectSchema } from './projects.validation';
import * as controller from './projects.controller';

export const projectsRouter = Router();

projectsRouter.use(authenticate);

projectsRouter.get('/', asyncHandler(controller.list));
projectsRouter.get('/:id', asyncHandler(controller.getById));
projectsRouter.post('/', authorize('admin', 'manager'), validate(createProjectSchema), asyncHandler(controller.create));
projectsRouter.patch('/:id', authorize('admin', 'manager'), validate(updateProjectSchema), asyncHandler(controller.update));
projectsRouter.delete('/:id', authorize('admin', 'manager'), asyncHandler(controller.remove));

// Members (M:N)
projectsRouter.get('/:id/members', asyncHandler(controller.listMembers));
projectsRouter.post('/:id/members', authorize('admin', 'manager'), validate(addMemberSchema), asyncHandler(controller.addMember));
projectsRouter.delete('/:id/members/:employeeId', authorize('admin', 'manager'), asyncHandler(controller.removeMember));
