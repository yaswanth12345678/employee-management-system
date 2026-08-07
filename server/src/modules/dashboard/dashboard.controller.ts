import type { Request, Response } from 'express';
import type { ApiResponse, DashboardSummaryDTO } from '@ems/shared';
import * as service from './dashboard.service';

export async function summary(req: Request, res: Response): Promise<void> {
  const data = await service.summary(req.user!.id, req.user!.role);
  res.status(200).json({ data } satisfies ApiResponse<DashboardSummaryDTO>);
}
