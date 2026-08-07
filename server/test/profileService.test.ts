import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/modules/profile/profile.repository', () => ({
  getPasswordHash: vi.fn(),
  updatePasswordHash: vi.fn().mockResolvedValue(undefined),
  updateProfile: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../src/modules/auth/auth.repository', () => ({ bumpTokenVersion: vi.fn().mockResolvedValue(undefined) }));

import * as repo from '../src/modules/profile/profile.repository';
import { bumpTokenVersion } from '../src/modules/auth/auth.repository';
import { changePassword } from '../src/modules/profile/profile.service';
import { hashPassword } from '../src/libs/password';
import { UnauthenticatedError, ValidationError } from '../src/common/errors';

type Mock = ReturnType<typeof vi.fn>;
const getPasswordHash = repo.getPasswordHash as unknown as Mock;
const updatePasswordHash = repo.updatePasswordHash as unknown as Mock;
const bump = bumpTokenVersion as unknown as Mock;

describe('profile.service.changePassword', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects when the account has no password on file', async () => {
    getPasswordHash.mockResolvedValue(null);
    await expect(
      changePassword('user-1', { currentPassword: 'x', newPassword: 'NewPass1!' }),
    ).rejects.toBeInstanceOf(UnauthenticatedError);
    expect(updatePasswordHash).not.toHaveBeenCalled();
  });

  it('rejects (and changes nothing) when the current password is wrong', async () => {
    getPasswordHash.mockResolvedValue(await hashPassword('RightCurrent1!'));
    await expect(
      changePassword('user-1', { currentPassword: 'WrongCurrent', newPassword: 'NewPass1!' }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(updatePasswordHash).not.toHaveBeenCalled();
    expect(bump).not.toHaveBeenCalled(); // no session revocation on a failed attempt
  });

  it('updates the hash and revokes sessions when the current password is correct', async () => {
    getPasswordHash.mockResolvedValue(await hashPassword('RightCurrent1!'));
    await changePassword('user-1', { currentPassword: 'RightCurrent1!', newPassword: 'NewPass1!' });

    expect(updatePasswordHash).toHaveBeenCalledTimes(1);
    expect(updatePasswordHash.mock.calls[0][0]).toBe('user-1');
    // the stored value is a fresh bcrypt hash of the NEW password, not the plaintext
    const storedHash = updatePasswordHash.mock.calls[0][1] as string;
    expect(storedHash.startsWith('$2')).toBe(true);
    expect(storedHash).not.toBe('NewPass1!');
    expect(bump).toHaveBeenCalledWith('user-1');
  });
});
