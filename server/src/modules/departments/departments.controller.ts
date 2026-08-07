import type { Request, Response } from 'express';
import type { ApiResponse, DepartmentDTO } from '@ems/shared';
import { parseWith } from '../../common/validation/parse';
import * as service from './departments.service';
import { listDepartmentsQuerySchema } from './departments.validation';
import type { CreateDepartmentInput, UpdateDepartmentInput } from './departments.validation';

/** HTTP adapters. Read the request, call one service method, shape the response. */

export async function list(req: Request, res: Response): Promise<void> {
  const query = parseWith(listDepartmentsQuerySchema, req.query);
  const result = await service.list(query);
  res.status(200).json(result); // already { data, meta } (PaginatedResponse)
}

export async function getById(req: Request, res: Response): Promise<void> {
  const dept = await service.getById(req.params.id);
  res.status(200).json({ data: dept } satisfies ApiResponse<DepartmentDTO>);
}

export async function create(req: Request, res: Response): Promise<void> {
  const dept = await service.create(req.body as CreateDepartmentInput);
  res.status(201).json({ data: dept } satisfies ApiResponse<DepartmentDTO>);
}

export async function update(req: Request, res: Response): Promise<void> {
  const dept = await service.update(req.params.id, req.body as UpdateDepartmentInput);
  res.status(200).json({ data: dept } satisfies ApiResponse<DepartmentDTO>);
}

export async function remove(req: Request, res: Response): Promise<void> {
  await service.remove(req.params.id);
  res.status(204).send();
}
