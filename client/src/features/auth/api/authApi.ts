import type { ApiResponse, AuthUser, LoginRequest, LoginResponse } from '@ems/shared';
import { httpClient } from '../../../lib/http';

/**
 * The auth feature's API layer. Thin, typed functions over the shared http client — the ONLY
 * place auth endpoints are named. Components/hooks call these, never `httpClient` directly, so
 * the URL and response-unwrapping live in exactly one spot per endpoint.
 *
 * Note how the request/response types come straight from `@ems/shared` — the same contract the
 * server implements. If the backend changes `LoginResponse`, this file fails to compile.
 */
export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const { data } = await httpClient.post<ApiResponse<LoginResponse>>('/auth/login', payload);
  return data.data;
}

/** Uses the httpOnly refresh cookie (no body) to obtain a fresh access token + user. */
export async function refresh(): Promise<LoginResponse> {
  const { data } = await httpClient.post<ApiResponse<LoginResponse>>('/auth/refresh');
  return data.data;
}

export async function getMe(): Promise<AuthUser> {
  const { data } = await httpClient.get<ApiResponse<AuthUser>>('/auth/me');
  return data.data;
}

export async function logout(): Promise<void> {
  await httpClient.post('/auth/logout');
}

export async function forgotPassword(email: string): Promise<{ message: string; resetToken?: string }> {
  const { data } = await httpClient.post<ApiResponse<{ message: string; resetToken?: string }>>(
    '/auth/forgot-password',
    { email },
  );
  return data.data;
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await httpClient.post('/auth/reset-password', { token, newPassword });
}
