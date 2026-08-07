import { Router } from 'express';
import { asyncHandler } from '../../common/http/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { updateSettingsSchema } from './settings.validation';
import * as controller from './settings.controller';

export const settingsRouter = Router();

settingsRouter.use(authenticate);

settingsRouter.get('/', asyncHandler(controller.get));
settingsRouter.patch('/', validate(updateSettingsSchema), asyncHandler(controller.update));
