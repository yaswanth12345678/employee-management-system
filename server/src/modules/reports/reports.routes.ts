import { Router } from 'express';
import { asyncHandler } from '../../common/http/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import * as controller from './reports.controller';

/** Read-only aggregate reports — restricted to admin/hr/manager. */
export const reportsRouter = Router();

reportsRouter.use(authenticate, authorize('admin', 'hr', 'manager'));

reportsRouter.get('/attendance-summary', asyncHandler(controller.attendanceSummary));
reportsRouter.get('/leave-summary', asyncHandler(controller.leaveSummary));
reportsRouter.get('/project-status', asyncHandler(controller.projectStatus));
reportsRouter.get('/headcount', asyncHandler(controller.headcount));
