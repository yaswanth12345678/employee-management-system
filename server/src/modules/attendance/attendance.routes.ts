import { Router } from 'express';
import { asyncHandler } from '../../common/http/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { checkInSchema } from './attendance.validation';
import * as controller from './attendance.controller';

export const attendanceRouter = Router();

attendanceRouter.use(authenticate);

attendanceRouter.post('/check-in', validate(checkInSchema), asyncHandler(controller.checkIn));
attendanceRouter.post('/check-out', asyncHandler(controller.checkOut));
attendanceRouter.get('/today', asyncHandler(controller.today));
attendanceRouter.get('/me', asyncHandler(controller.listMine));
attendanceRouter.get('/', authorize('admin', 'hr', 'manager'), asyncHandler(controller.listAll));
