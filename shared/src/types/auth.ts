import type { RoleName } from '../enums';

/** Credentials submitted to POST /auth/login. */
export interface LoginRequest {
  email: string;
  password: string;
}

/** The authenticated principal returned to the client (never includes the password hash). */
export interface AuthUser {
  id: string;
  email: string;
  role: RoleName;
  isActive: boolean;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  } | null;
}

/**
 * The access token is returned in the body (kept in memory on the client).
 * The refresh token is delivered separately as an httpOnly cookie — never in this body.
 */
export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
