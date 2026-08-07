import type { Request, Response } from 'express';
import type { ApiResponse, EmployeeDTO } from '@ems/shared';
import { parseWith } from '../../common/validation/parse';
import * as service from './employees.service';
import { listEmployeesQuerySchema } from './employees.validation';
import type { CreateEmployeeInput, UpdateEmployeeInput } from './employees.validation';

export async function list(req: Request, res: Response): Promise<void> {
  const query = parseWith(listEmployeesQuerySchema, req.query);
  const result = await service.list(query);
  res.status(200).json(result);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const employee = await service.getById(req.params.id);
  res.status(200).json({ data: employee } satisfies ApiResponse<EmployeeDTO>);
}

export async function create(req: Request, res: Response): Promise<void> {
  const employee = await service.create(req.body as CreateEmployeeInput, req.user!.role);
  res.status(201).json({ data: employee } satisfies ApiResponse<EmployeeDTO>);
}

export async function update(req: Request, res: Response): Promise<void> {
  const employee = await service.update(req.params.id, req.body as UpdateEmployeeInput);
  res.status(200).json({ data: employee } satisfies ApiResponse<EmployeeDTO>);
}

export async function remove(req: Request, res: Response): Promise<void> {
  await service.remove(req.params.id);
  res.status(204).send();
}
