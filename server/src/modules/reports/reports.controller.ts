import type { Request, Response } from 'express';
import type {
  ApiResponse,
  AttendanceSummaryDTO,
  HeadcountSummaryDTO,
  LeaveSummaryDTO,
  ProjectStatusSummaryDTO,
} from '@ems/shared';
import { parseWith } from '../../common/validation/parse';
import * as service from './reports.service';
import { dateRangeSchema } from './reports.validation';

export async function attendanceSummary(req: Request, res: Response): Promise<void> {
  const range = parseWith(dateRangeSchema, req.query);
  res.status(200).json({ data: await service.attendanceSummary(range) } satisfies ApiResponse<AttendanceSummaryDTO>);
}

export async function leaveSummary(req: Request, res: Response): Promise<void> {
  const range = parseWith(dateRangeSchema, req.query);
  res.status(200).json({ data: await service.leaveSummary(range) } satisfies ApiResponse<LeaveSummaryDTO>);
}

export async function projectStatus(_req: Request, res: Response): Promise<void> {
  res.status(200).json({ data: await service.projectStatusSummary() } satisfies ApiResponse<ProjectStatusSummaryDTO>);
}

export async function headcount(_req: Request, res: Response): Promise<void> {
  res.status(200).json({ data: await service.headcountSummary() } satisfies ApiResponse<HeadcountSummaryDTO>);
}
