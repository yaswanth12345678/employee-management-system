import type { Request, Response } from 'express';
import type { ApiResponse, AttendanceDTO } from '@ems/shared';
import { parseWith } from '../../common/validation/parse';
import * as service from './attendance.service';
import { listAttendanceQuerySchema } from './attendance.validation';
import type { CheckInInput } from './attendance.validation';

export async function checkIn(req: Request, res: Response): Promise<void> {
  const record = await service.checkIn(req.user!.id, req.body as CheckInInput);
  res.status(201).json({ data: record } satisfies ApiResponse<AttendanceDTO>);
}

export async function checkOut(req: Request, res: Response): Promise<void> {
  const record = await service.checkOut(req.user!.id);
  res.status(200).json({ data: record } satisfies ApiResponse<AttendanceDTO>);
}

export async function today(req: Request, res: Response): Promise<void> {
  const record = await service.today(req.user!.id);
  res.status(200).json({ data: record } satisfies ApiResponse<AttendanceDTO | null>);
}

export async function listMine(req: Request, res: Response): Promise<void> {
  const query = parseWith(listAttendanceQuerySchema, req.query);
  res.status(200).json(await service.listMine(req.user!.id, query));
}

export async function listAll(req: Request, res: Response): Promise<void> {
  const query = parseWith(listAttendanceQuerySchema, req.query);
  res.status(200).json(await service.listAll(query));
}
