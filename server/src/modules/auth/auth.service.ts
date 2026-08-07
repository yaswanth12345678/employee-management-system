import crypto from 'node:crypto';
import type { AuthUser, LoginResponse } from '@ems/shared';
import { UnauthenticatedError, ValidationError } from '../../common/errors';
import { hashPassword, verifyPassword } from '../../libs/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../libs/jwt';
import { logger } from '../../libs/logger';
import * as authRepository from './auth.repository';
import type { AuthUserRow } from './auth.repository';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

/**
 * A bcrypt hash of a random value, computed once (lazily, with the configured cost). When login
 * can't find the user (or the account is inactive) we still run verifyPassword against THIS hash so
 * the request spends the same ~bcrypt time as a real password check. Without it, the not-found path
 * returns before bcrypt runs, and the response-time gap is a timing oracle for email enumeration.
 */
let dummyHash: Promise<string> | null = null;
function getDummyHash(): Promise<string> {
  dummyHash ??= hashPassword(crypto.randomBytes(16).toString('hex'));
  return dummyHash;
}

/**
 * Auth business logic. Knows nothing about HTTP (no req/res) — it's callable from a controller,
 * a test, or a CLI. It orchestrates the repository + crypto libs and enforces the rules.
 */

/** Map a raw DB row to the client-facing DTO (and drop the password hash entirely). */
function toAuthUser(row: AuthUserRow): AuthUser {
  return {
    id: row.id,
    email: row.email,
    role: row.role_name,
    isActive: row.is_active,
    employee: row.employee_id
      ? {
          id: row.employee_id,
          firstName: row.first_name ?? '',
          lastName: row.last_name ?? '',
          avatarUrl: row.avatar_url ?? undefined,
        }
      : null,
  };
}

export interface AuthResult {
  response: LoginResponse;
  refreshToken: string;
}

export async function login(email: string, password: string): Promise<AuthResult> {
  const user = await authRepository.findUserByEmail(email);

  // Always run bcrypt — against the real hash if the user exists, otherwise a dummy — so the timing
  // is identical whether or not the account exists (closes the email-enumeration timing side-channel).
  const passwordMatches = await verifyPassword(password, user?.password_hash ?? (await getDummyHash()));

  // Deliberately identical error whether the email is unknown, the account is disabled, or the
  // password is wrong — revealing which one leaks information to attackers (account enumeration).
  if (!user || !user.is_active || !passwordMatches) {
    throw new UnauthenticatedError('Invalid email or password');
  }

  await authRepository.updateLastLogin(user.id);

  return {
    response: {
      accessToken: signAccessToken(user.id, user.role_name),
      user: toAuthUser(user),
    },
    refreshToken: signRefreshToken(user.id, user.token_version),
  };
}

export async function refresh(refreshToken: string): Promise<AuthResult> {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new UnauthenticatedError('Invalid or expired session');
  }

  // Re-load the user each refresh so a deactivated account can't keep minting access tokens.
  const user = await authRepository.findUserById(payload.sub);
  if (!user || !user.is_active) {
    throw new UnauthenticatedError('Invalid or expired session');
  }
  // Reject refresh tokens issued before a logout / password change / reset (revocation).
  if (payload.tv !== user.token_version) {
    throw new UnauthenticatedError('Session has been revoked');
  }

  // Rotate the refresh token (sliding session) alongside the new access token.
  return {
    response: {
      accessToken: signAccessToken(user.id, user.role_name),
      user: toAuthUser(user),
    },
    refreshToken: signRefreshToken(user.id, user.token_version),
  };
}

/** Revoke the session behind a refresh token (bumps token_version). Best-effort. */
export async function logout(refreshToken: string | undefined): Promise<void> {
  if (!refreshToken) return;
  try {
    const payload = verifyRefreshToken(refreshToken);
    await authRepository.bumpTokenVersion(payload.sub);
  } catch {
    // Invalid/expired token — nothing to revoke.
  }
}

export async function getCurrentUser(userId: string): Promise<AuthUser> {
  const user = await authRepository.findUserById(userId);
  if (!user) {
    throw new UnauthenticatedError('Session no longer valid');
  }
  return toAuthUser(user);
}

/**
 * Create a password-reset token. Returns the raw token so the controller can (in dev) surface it
 * for testing; in production this would be emailed, never returned. Returns null for unknown
 * emails (the controller still responds 200 to avoid account enumeration).
 */
export async function forgotPassword(email: string): Promise<string | null> {
  const userId = await authRepository.findUserIdByEmail(email);
  if (!userId) return null;
  const token = crypto.randomBytes(32).toString('hex');
  await authRepository.createResetToken(
    userId,
    sha256(token),
    new Date(Date.now() + RESET_TOKEN_TTL_MS),
  );
  logger.info(`Password reset requested for ${email} (token would be emailed).`);
  return token;
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const record = await authRepository.findValidResetToken(sha256(token));
  if (!record) {
    throw new ValidationError('Invalid or expired reset token');
  }
  await authRepository.setPassword(record.userId, await hashPassword(newPassword));
  await authRepository.markResetTokenUsed(record.id);
  await authRepository.bumpTokenVersion(record.userId); // revoke existing sessions
}
