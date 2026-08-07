import type { Request, Response } from 'express';
import type { ApiResponse, LeaveRequestDTO } from '@ems/shared';
import { parseWith } from '../../common/validation/parse';
import * as service from './leave.service';
import { listLeaveQuerySchema } from './leave.validation';
import type { CreateLeaveInput } from './leave.validation';

export async function list(req: Request, res: Response): Promise<void> {
  const query = parseWith(listLeaveQuerySchema, req.query);
  res.status(200).json(await service.list(req.user!.id, req.user!.role, query));
}

export async function apply(req: Request, res: Response): Promise<void> {
  const leave = await service.apply(req.user!.id, req.body as CreateLeaveInput);
  res.status(201).json({ data: leave } satisfies ApiResponse<LeaveRequestDTO>);
}

export async function approve(req: Request, res: Response): Promise<void> {
  const leave = await service.approve(req.params.id, req.user!.id);
  res.status(200).json({ data: leave } satisfies ApiResponse<LeaveRequestDTO>);
}

export async function reject(req: Request, res: Response): Promise<void> {
  const leave = await service.reject(req.params.id, req.user!.id);
  res.status(200).json({ data: leave } satisfies ApiResponse<LeaveRequestDTO>);
}

export async function cancel(req: Request, res: Response): Promise<void> {
  const leave = await service.cancel(req.params.id, req.user!.id);
  res.status(200).json({ data: leave } satisfies ApiResponse<LeaveRequestDTO>);
}
