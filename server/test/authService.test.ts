import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the data-access layer so the service can be exercised without a database. Everything else
// (bcrypt hashing/verification, JWT signing/verifying, sha256) runs for real.
vi.mock('../src/modules/auth/auth.repository', () => ({
  findUserByEmail: vi.fn(),
  updateLastLogin: vi.fn().mockResolvedValue(undefined),
  findUserById: vi.fn(),
  bumpTokenVersion: vi.fn().mockResolvedValue(undefined),
  findUserIdByEmail: vi.fn(),
  createResetToken: vi.fn().mockResolvedValue(undefined),
  findValidResetToken: vi.fn(),
  markResetTokenUsed: vi.fn().mockResolvedValue(undefined),
  setPassword: vi.fn().mockResolvedValue(undefined),
}));

import * as authRepository from '../src/modules/auth/auth.repository';
import { login, refresh, logout, forgotPassword, resetPassword } from '../src/modules/auth/auth.service';
import { hashPassword } from '../src/libs/password';
import { signRefreshToken, verifyAccessToken, verifyRefreshToken } from '../src/libs/jwt';
import { UnauthenticatedError, ValidationError } from '../src/common/errors';

type Mock = ReturnType<typeof vi.fn>;
const findUserByEmail = authRepository.findUserByEmail as unknown as Mock;
const findUserById = authRepository.findUserById as unknown as Mock;
const bumpTokenVersion = authRepository.bumpTokenVersion as unknown as Mock;
const findUserIdByEmail = authRepository.findUserIdByEmail as unknown as Mock;
const createResetToken = authRepository.createResetToken as unknown as Mock;
const findValidResetToken = authRepository.findValidResetToken as unknown as Mock;
const markResetTokenUsed = authRepository.markResetTokenUsed as unknown as Mock;
const setPassword = authRepository.setPassword as unknown as Mock;

function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    email: 'a@x.com',
    password_hash: '',
    role_name: 'employee',
    is_active: true,
    token_version: 3,
    employee_id: null,
    first_name: null,
    last_name: null,
    avatar_url: null,
    ...overrides,
  };
}

describe('auth.service login (post timing-fix refactor)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns signed access + refresh tokens for a valid active user with the correct password', async () => {
    const password = 'Correct1!';
    findUserByEmail.mockResolvedValue(makeUser({ password_hash: await hashPassword(password) }));

    const result = await login('a@x.com', password);

    expect(verifyAccessToken(result.response.accessToken).sub).toBe('user-1');
    expect(verifyRefreshToken(result.refreshToken).tv).toBe(3);
    expect(authRepository.updateLastLogin).toHaveBeenCalledWith('user-1');
  });

  it('rejects a wrong password', async () => {
    findUserByEmail.mockResolvedValue(makeUser({ password_hash: await hashPassword('Correct1!') }));
    await expect(login('a@x.com', 'WRONG')).rejects.toBeInstanceOf(UnauthenticatedError);
  });

  it('rejects an unknown email (bcrypt still runs against the dummy hash for constant time)', async () => {
    findUserByEmail.mockResolvedValue(null);
    await expect(login('nobody@x.com', 'whatever')).rejects.toBeInstanceOf(UnauthenticatedError);
    expect(authRepository.updateLastLogin).not.toHaveBeenCalled();
  });

  it('rejects an inactive account even with the correct password', async () => {
    findUserByEmail.mockResolvedValue(
      makeUser({ password_hash: await hashPassword('Correct1!'), is_active: false }),
    );
    await expect(login('a@x.com', 'Correct1!')).rejects.toBeInstanceOf(UnauthenticatedError);
  });
});

describe('auth.service refresh (token-version revocation)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects a malformed refresh token', async () => {
    await expect(refresh('not.a.valid.token')).rejects.toBeInstanceOf(UnauthenticatedError);
  });

  it('rejects a refresh token whose tv no longer matches the user (revoked session)', async () => {
    findUserById.mockResolvedValue(makeUser({ token_version: 5 }));
    const stale = signRefreshToken('user-1', 4); // issued before a logout/password-change bumped tv
    await expect(refresh(stale)).rejects.toBeInstanceOf(UnauthenticatedError);
  });

  it('rejects refresh for a deactivated account', async () => {
    findUserById.mockResolvedValue(makeUser({ is_active: false, token_version: 3 }));
    await expect(refresh(signRefreshToken('user-1', 3))).rejects.toBeInstanceOf(UnauthenticatedError);
  });

  it('rotates tokens when tv matches', async () => {
    findUserById.mockResolvedValue(makeUser({ token_version: 5 }));
    const result = await refresh(signRefreshToken('user-1', 5));
    expect(verifyAccessToken(result.response.accessToken).sub).toBe('user-1');
    expect(verifyRefreshToken(result.refreshToken).tv).toBe(5);
  });
});

describe('auth.service logout (revocation)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('bumps token_version for a valid refresh token', async () => {
    await logout(signRefreshToken('user-9', 1));
    expect(bumpTokenVersion).toHaveBeenCalledWith('user-9');
  });

  it('is a no-op when no token is supplied', async () => {
    await logout(undefined);
    expect(bumpTokenVersion).not.toHaveBeenCalled();
  });

  it('silently ignores an invalid token', async () => {
    await logout('garbage');
    expect(bumpTokenVersion).not.toHaveBeenCalled();
  });
});

describe('auth.service forgotPassword (no enumeration, hashed token)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns null and stores nothing for an unknown email', async () => {
    findUserIdByEmail.mockResolvedValue(null);
    expect(await forgotPassword('nobody@x.com')).toBeNull();
    expect(createResetToken).not.toHaveBeenCalled();
  });

  it('stores a sha256 HASH (never the raw token) with a future expiry, and returns the raw token', async () => {
    findUserIdByEmail.mockResolvedValue('user-1');
    const token = await forgotPassword('a@x.com');

    expect(typeof token).toBe('string');
    expect(createResetToken).toHaveBeenCalledTimes(1);
    const [userId, tokenHash, expiresAt] = createResetToken.mock.calls[0];
    expect(userId).toBe('user-1');
    expect(tokenHash).toMatch(/^[a-f0-9]{64}$/); // sha256 hex
    expect(tokenHash).not.toBe(token); // the raw token is NEVER persisted
    expect((expiresAt as Date).getTime()).toBeGreaterThan(Date.now());
  });
});

describe('auth.service resetPassword (single-use, revokes sessions)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects an invalid or expired token without touching the password', async () => {
    findValidResetToken.mockResolvedValue(null);
    await expect(resetPassword('sometoken', 'NewPass1!')).rejects.toBeInstanceOf(ValidationError);
    expect(setPassword).not.toHaveBeenCalled();
    expect(bumpTokenVersion).not.toHaveBeenCalled();
  });

  it('sets the new password, consumes the token, and revokes existing sessions', async () => {
    findValidResetToken.mockResolvedValue({ id: 'R1', userId: 'user-1' });
    await resetPassword('sometoken', 'NewPass1!');

    expect(findValidResetToken).toHaveBeenCalledWith(expect.stringMatching(/^[a-f0-9]{64}$/));
    expect(setPassword).toHaveBeenCalledTimes(1);
    expect(setPassword.mock.calls[0][0]).toBe('user-1');
    expect(markResetTokenUsed).toHaveBeenCalledWith('R1'); // token can't be reused
    expect(bumpTokenVersion).toHaveBeenCalledWith('user-1'); // all sessions revoked
  });
});
