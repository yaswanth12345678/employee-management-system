import type { Request, Response } from 'express';
import type { ApiResponse, AuthUser, LoginResponse } from '@ems/shared';
import { UnauthenticatedError } from '../../common/errors';
import { REFRESH_COOKIE_NAME, clearRefreshCookie, setRefreshCookie } from '../../common/http/cookies';
import { env } from '../../config/env';
import * as authService from './auth.service';
import type { ForgotPasswordInput, LoginInput, ResetPasswordInput } from './auth.validation';

/**
 * HTTP adapter for the auth service. Its ONLY jobs: read the request, call one service method,
 * shape the response (including the refresh cookie). No business logic, no SQL.
 */

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as LoginInput;
  const { response, refreshToken } = await authService.login(email, password);

  setRefreshCookie(res, refreshToken);
  res.status(200).json({ data: response } satisfies ApiResponse<LoginResponse>);
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
  if (!token) {
    throw new UnauthenticatedError('No active session');
  }

  const { response, refreshToken } = await authService.refresh(token);
  setRefreshCookie(res, refreshToken);
  res.status(200).json({ data: response } satisfies ApiResponse<LoginResponse>);
}

export async function logout(req: Request, res: Response): Promise<void> {
  // Revoke the refresh token (bumps token_version) so it can't mint new access tokens,
  // then clear the cookie.
  const token = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
  await authService.logout(token);
  clearRefreshCookie(res);
  res.status(204).send();
}

export async function me(req: Request, res: Response): Promise<void> {
  // `authenticate` guarantees req.user is set before this runs.
  const user = await authService.getCurrentUser(req.user!.id);
  res.status(200).json({ data: user } satisfies ApiResponse<AuthUser>);
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const { email } = req.body as ForgotPasswordInput;
  const token = await authService.forgotPassword(email);
  // Always 200 (no account enumeration). In non-production, return the token to ease testing.
  res.status(200).json({
    data: {
      message: 'If an account exists for that email, a password reset link has been sent.',
      resetToken: env.NODE_ENV !== 'production' ? (token ?? undefined) : undefined,
    },
  });
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { token, newPassword } = req.body as ResetPasswordInput;
  await authService.resetPassword(token, newPassword);
  res.status(204).send();
}
