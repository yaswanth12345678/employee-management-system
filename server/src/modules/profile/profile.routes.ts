import { Router, type NextFunction, type Request, type Response } from 'express';
import { asyncHandler } from '../../common/http/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { ValidationError } from '../../common/errors';
import { avatarUpload } from '../../libs/upload';
import { changePasswordSchema, updateProfileSchema } from './profile.validation';
import * as controller from './profile.controller';

/** The CURRENT user's own profile (self-service, narrow field set). */
export const profileRouter = Router();

// Wrap multer so upload errors (bad type / too large) become a clean 400 instead of a 500.
function uploadAvatarMiddleware(req: Request, res: Response, next: NextFunction): void {
  avatarUpload.single('avatar')(req, res, (err: unknown) => {
    if (err) {
      next(new ValidationError(err instanceof Error ? err.message : 'Upload failed'));
      return;
    }
    next();
  });
}

profileRouter.use(authenticate);

profileRouter.get('/', asyncHandler(controller.get));
profileRouter.patch('/', validate(updateProfileSchema), asyncHandler(controller.update));
profileRouter.patch('/password', validate(changePasswordSchema), asyncHandler(controller.changePassword));
profileRouter.post('/avatar', uploadAvatarMiddleware, asyncHandler(controller.uploadAvatar));
