import type { EmployeeDTO } from '@ems/shared';
import { NotFoundError, UnauthenticatedError, ValidationError } from '../../common/errors';
import { findEmployeeIdByUserId } from '../employees/employees.repository';
import { hashPassword, verifyPassword } from '../../libs/password';
import { bumpTokenVersion } from '../auth/auth.repository';
import * as employeesService from '../employees/employees.service';
import * as repo from './profile.repository';
import type { ChangePasswordInput, UpdateProfileInput } from './profile.validation';

async function requireEmployeeId(userId: string): Promise<string> {
  const id = await findEmployeeIdByUserId(userId);
  if (!id) throw new NotFoundError('No employee profile for this account');
  return id;
}

export async function getProfile(userId: string): Promise<EmployeeDTO> {
  const employeeId = await requireEmployeeId(userId);
  return employeesService.getById(employeeId);
}

export async function updateProfile(userId: string, input: UpdateProfileInput): Promise<EmployeeDTO> {
  const employeeId = await requireEmployeeId(userId);
  await repo.updateProfile(userId, input);
  return employeesService.getById(employeeId);
}

export async function updateAvatar(userId: string, avatarUrl: string): Promise<EmployeeDTO> {
  const employeeId = await requireEmployeeId(userId);
  await repo.updateProfile(userId, { avatarUrl });
  return employeesService.getById(employeeId);
}

export async function changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
  const hash = await repo.getPasswordHash(userId);
  if (!hash) throw new UnauthenticatedError('Account not found');
  const matches = await verifyPassword(input.currentPassword, hash);
  if (!matches) throw new ValidationError('Current password is incorrect', [
    { field: 'currentPassword', message: 'Current password is incorrect' },
  ]);
  await repo.updatePasswordHash(userId, await hashPassword(input.newPassword));
  // Invalidate existing sessions after a password change.
  await bumpTokenVersion(userId);
}
