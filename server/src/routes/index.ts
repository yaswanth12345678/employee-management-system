import { Router } from 'express';
import { healthRouter } from '../modules/health/health.routes';
import { authRouter } from '../modules/auth';
import { departmentsRouter } from '../modules/departments';
import { employeesRouter } from '../modules/employees';
import { projectsRouter } from '../modules/projects';
import { tasksRouter } from '../modules/tasks';
import { leaveRouter } from '../modules/leave';
import { attendanceRouter } from '../modules/attendance';
import { notificationsRouter } from '../modules/notifications';
import { reportsRouter } from '../modules/reports';
import { profileRouter } from '../modules/profile';
import { settingsRouter } from '../modules/settings';
import { dashboardRouter } from '../modules/dashboard';

/**
 * The API v1 root router. Every feature module's router is mounted here under its own
 * path prefix. As we build modules (auth, employees, ...) they get added as one line each.
 */
export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/departments', departmentsRouter);
apiRouter.use('/employees', employeesRouter);
apiRouter.use('/projects', projectsRouter);
apiRouter.use('/tasks', tasksRouter);
apiRouter.use('/leave-requests', leaveRouter);
apiRouter.use('/attendance', attendanceRouter);
apiRouter.use('/notifications', notificationsRouter);
apiRouter.use('/reports', reportsRouter);
apiRouter.use('/profile', profileRouter);
apiRouter.use('/settings', settingsRouter);
apiRouter.use('/dashboard', dashboardRouter);
