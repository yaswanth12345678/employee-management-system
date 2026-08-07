import { describe, it, expect } from 'vitest';
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '../src/libs/jwt';
import { hashPassword, verifyPassword } from '../src/libs/password';

describe('jwt', () => {
  it('round-trips an access token with sub, role and type', () => {
    const token = signAccessToken('user-1', 'admin');
    const payload = verifyAccessToken(token);
    expect(payload.sub).toBe('user-1');
    expect(payload.role).toBe('admin');
    expect(payload.type).toBe('access');
  });

  it('round-trips a refresh token carrying the token version', () => {
    const token = signRefreshToken('user-2', 7);
    const payload = verifyRefreshToken(token);
    expect(payload.sub).toBe('user-2');
    expect(payload.type).toBe('refresh');
    expect(payload.tv).toBe(7);
  });

  it('rejects a tampered token', () => {
    expect(() => verifyAccessToken('not.a.valid.token')).toThrow();
  });
});

describe('password', () => {
  it('hashes with bcrypt and verifies correctly', async () => {
    const hash = await hashPassword('S3cret!!');
    expect(hash.startsWith('$2')).toBe(true);
    expect(await verifyPassword('S3cret!!', hash)).toBe(true);
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });
});
