import type { Request, Response } from 'express';
import type { ApiResponse, EmployeeDTO } from '@ems/shared';
import { ValidationError } from '../../common/errors';
import { env } from '../../config/env';
import * as service from './profile.service';
import type { ChangePasswordInput, UpdateProfileInput } from './profile.validation';

export async function get(req: Request, res: Response): Promise<void> {
  const profile = await service.getProfile(req.user!.id);
  res.status(200).json({ data: profile } satisfies ApiResponse<EmployeeDTO>);
}

export async function update(req: Request, res: Response): Promise<void> {
  const profile = await service.updateProfile(req.user!.id, req.body as UpdateProfileInput);
  res.status(200).json({ data: profile } satisfies ApiResponse<EmployeeDTO>);
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  await service.changePassword(req.user!.id, req.body as ChangePasswordInput);
  res.status(204).send();
}

export async function uploadAvatar(req: Request, res: Response): Promise<void> {
  if (!req.file) throw new ValidationError('No image uploaded');
  const url = `${env.PUBLIC_URL}/uploads/avatars/${req.file.filename}`;
  const profile = await service.updateAvatar(req.user!.id, url);
  res.status(200).json({ data: profile } satisfies ApiResponse<EmployeeDTO>);
}
