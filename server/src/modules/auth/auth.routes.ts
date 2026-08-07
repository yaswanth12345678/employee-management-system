import { Router } from 'express';
import { asyncHandler } from '../../common/http/asyncHandler';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { rateLimit } from '../../middleware/rateLimit';
import { forgotPasswordSchema, loginSchema, resetPasswordSchema } from './auth.validation';
import * as authController from './auth.controller';

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, keyFromBody: 'email' });
const forgotLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, keyFromBody: 'email' });

/**
 * Auth routes. Each line reads as a policy:
 *   login   — public, body validated
 *   refresh — public (proves identity via the httpOnly cookie, not a token header)
 *   logout  — public + idempotent (clears the cookie even if the access token expired)
 *   me      — requires a valid access token (authenticate)
 */
export const authRouter = Router();

authRouter.post('/login', loginLimiter, validate(loginSchema), asyncHandler(authController.login));
authRouter.post('/refresh', asyncHandler(authController.refresh));
authRouter.post('/logout', asyncHandler(authController.logout));
authRouter.get('/me', authenticate, asyncHandler(authController.me));
authRouter.post(
  '/forgot-password',
  forgotLimiter,
  validate(forgotPasswordSchema),
  asyncHandler(authController.forgotPassword),
);
authRouter.post(
  '/reset-password',
  validate(resetPasswordSchema),
  asyncHandler(authController.resetPassword),
);
