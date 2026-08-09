import { Router } from 'express';
import { asyncHandler } from '../../common/http/asyncHandler';
import * as controller from './health.controller';

/**
 * Health module router. Liveness and readiness probes for orchestrators / load balancers.
 */
export const healthRouter = Router();

healthRouter.get('/', controller.liveness);
healthRouter.get('/ready', asyncHandler(controller.readiness));
