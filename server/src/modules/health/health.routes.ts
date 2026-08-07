import { Router } from 'express';
import { asyncHandler } from '../../common/http/asyncHandler';
import { liveness, readiness } from './health.controller';

/**
 * Health module router. This is the shape every future module follows:
 * a `*.routes.ts` file maps URLs to controllers (and, later, to auth/validation middleware).
 */
export const healthRouter = Router();

healthRouter.get('/', liveness);
healthRouter.get('/ready', asyncHandler(readiness));
