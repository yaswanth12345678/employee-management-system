import type { Request, Response } from 'express';
import type { ApiResponse, ProjectDTO, ProjectMemberDTO } from '@ems/shared';
import { parseWith } from '../../common/validation/parse';
import * as service from './projects.service';
import { listProjectsQuerySchema } from './projects.validation';
import type { AddMemberInput, CreateProjectInput, UpdateProjectInput } from './projects.validation';

export async function list(req: Request, res: Response): Promise<void> {
  const query = parseWith(listProjectsQuerySchema, req.query);
  res.status(200).json(await service.list(query));
}

export async function getById(req: Request, res: Response): Promise<void> {
  const project = await service.getById(req.params.id);
  res.status(200).json({ data: project } satisfies ApiResponse<ProjectDTO>);
}

export async function create(req: Request, res: Response): Promise<void> {
  const project = await service.create(req.body as CreateProjectInput);
  res.status(201).json({ data: project } satisfies ApiResponse<ProjectDTO>);
}

export async function update(req: Request, res: Response): Promise<void> {
  const project = await service.update(req.params.id, req.body as UpdateProjectInput);
  res.status(200).json({ data: project } satisfies ApiResponse<ProjectDTO>);
}

export async function remove(req: Request, res: Response): Promise<void> {
  await service.remove(req.params.id);
  res.status(204).send();
}

export async function listMembers(req: Request, res: Response): Promise<void> {
  const members = await service.listMembers(req.params.id);
  res.status(200).json({ data: members } satisfies ApiResponse<ProjectMemberDTO[]>);
}

export async function addMember(req: Request, res: Response): Promise<void> {
  const body = req.body as AddMemberInput;
  await service.addMember(req.params.id, body.employeeId, body.roleOnProject);
  res.status(201).send();
}

export async function removeMember(req: Request, res: Response): Promise<void> {
  await service.removeMember(req.params.id, req.params.employeeId);
  res.status(204).send();
}
