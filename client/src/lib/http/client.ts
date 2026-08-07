import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { ApiErrorBody, ApiResponse, FieldError, LoginResponse } from '@ems/shared';
import { env } from '../../config/env';

/**
 * The ONE Axios instance for the whole app. Every API call goes through it, so cross-cutting
 * concerns (base URL, auth header, error shape, token refresh) are configured exactly once.
 */

// ── Access token store (in memory, NOT localStorage — XSS can't read a module variable) ──
let accessToken: string | null = null;
export function setAccessToken(token: string | null): void {
  accessToken = token;
}
export function getAccessToken(): string | null {
  return accessToken;
}

// Callback the interceptor invokes when the session is truly gone (refresh failed), so
// AuthContext can flip to "unauthenticated" and the guard redirects to /login.
let onSessionExpiredCb: (() => void) | null = null;
export function onSessionExpired(cb: () => void): void {
  onSessionExpiredCb = cb;
}

export const httpClient: AxiosInstance = axios.create({
  baseURL: env.apiUrl,
  withCredentials: true, // send the httpOnly refresh cookie
  // No default Content-Type: axios sets application/json for object bodies and the correct
  // multipart/form-data (with boundary) for FormData — needed for avatar uploads.
});

// ── Request interceptor: attach the access token ────────────────────────────
httpClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

/** The predictable error shape every caller gets after the interceptor runs. */
export interface NormalizedError {
  status: number;
  code: string;
  message: string;
  details?: FieldError[];
}

function normalizeError(error: AxiosError<ApiErrorBody>): NormalizedError {
  const body = error.response?.data;
  return {
    status: error.response?.status ?? 0,
    code: body?.error?.code ?? 'NETWORK_ERROR',
    message: body?.error?.message ?? error.message ?? 'Something went wrong',
    details: body?.error?.details,
  };
}

// ── 401 → refresh-and-retry ──────────────────────────────────────────────────
// When the access token expires, an API call returns 401. We transparently call /auth/refresh
// (using the httpOnly cookie), then replay the original request with the new token. The user
// never sees a blip. Two hazards this handles:
//   1. Infinite loops — we skip auth endpoints and retry each request at most once (_retry).
//   2. Concurrent 401s — if 5 requests fail at once, we refresh ONCE and queue the rest, then
//      replay them all with the new token (the "single-flight" pattern).
type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let isRefreshing = false;
let waitQueue: Array<(token: string | null) => void> = [];

function flushQueue(token: string | null): void {
  waitQueue.forEach((resume) => resume(token));
  waitQueue = [];
}

httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorBody>) => {
    const original = error.config as RetryableConfig | undefined;
    const status = error.response?.status ?? 0;
    const isAuthRoute = original?.url?.includes('/auth/') ?? false;

    // Only intercept 401s from NON-auth routes, and only retry once.
    if (status !== 401 || !original || isAuthRoute || original._retry) {
      return Promise.reject(normalizeError(error));
    }
    original._retry = true;

    // A refresh is already in flight → wait for it, then replay with the new token.
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        waitQueue.push((token) => {
          if (!token) {
            reject(normalizeError(error));
            return;
          }
          original.headers.Authorization = `Bearer ${token}`;
          resolve(httpClient(original));
        });
      });
    }

    isRefreshing = true;
    try {
      const { data } = await httpClient.post<ApiResponse<LoginResponse>>('/auth/refresh');
      const newToken = data.data.accessToken;
      setAccessToken(newToken);
      flushQueue(newToken);
      original.headers.Authorization = `Bearer ${newToken}`;
      return httpClient(original);
    } catch {
      // Refresh failed → the session is over. Wake queued requests with no token, and notify.
      flushQueue(null);
      setAccessToken(null);
      onSessionExpiredCb?.();
      return Promise.reject(normalizeError(error));
    } finally {
      isRefreshing = false;
    }
  },
);
