import type { Request, Response } from 'express';
import type { ApiResponse, UserSettingsDTO } from '@ems/shared';
import * as service from './settings.service';
import type { UpdateSettingsInput } from './settings.validation';

export async function get(req: Request, res: Response): Promise<void> {
  const settings = await service.get(req.user!.id);
  res.status(200).json({ data: settings } satisfies ApiResponse<UserSettingsDTO>);
}

export async function update(req: Request, res: Response): Promise<void> {
  const settings = await service.update(req.user!.id, req.body as UpdateSettingsInput);
  res.status(200).json({ data: settings } satisfies ApiResponse<UserSettingsDTO>);
}
