import type { Request, Response } from 'express';
import type { ApiResponse, CommentDTO, TaskDTO } from '@ems/shared';
import { parseWith } from '../../common/validation/parse';
import * as service from './tasks.service';
import { listTasksQuerySchema } from './tasks.validation';
import type {
  CreateCommentInput,
  CreateTaskInput,
  UpdateStatusInput,
  UpdateTaskInput,
} from './tasks.validation';

export async function list(req: Request, res: Response): Promise<void> {
  const query = parseWith(listTasksQuerySchema, req.query);
  res.status(200).json(await service.list(query));
}

export async function getById(req: Request, res: Response): Promise<void> {
  res.status(200).json({ data: await service.getById(req.params.id) } satisfies ApiResponse<TaskDTO>);
}

export async function create(req: Request, res: Response): Promise<void> {
  const task = await service.create(req.body as CreateTaskInput);
  res.status(201).json({ data: task } satisfies ApiResponse<TaskDTO>);
}

export async function update(req: Request, res: Response): Promise<void> {
  const task = await service.update(req.params.id, req.body as UpdateTaskInput);
  res.status(200).json({ data: task } satisfies ApiResponse<TaskDTO>);
}

export async function updateStatus(req: Request, res: Response): Promise<void> {
  const { status } = req.body as UpdateStatusInput;
  const task = await service.updateStatus(req.params.id, status, req.user!.id, req.user!.role);
  res.status(200).json({ data: task } satisfies ApiResponse<TaskDTO>);
}

export async function remove(req: Request, res: Response): Promise<void> {
  await service.remove(req.params.id);
  res.status(204).send();
}

export async function listComments(req: Request, res: Response): Promise<void> {
  const comments = await service.listComments(req.params.id);
  res.status(200).json({ data: comments } satisfies ApiResponse<CommentDTO[]>);
}

export async function addComment(req: Request, res: Response): Promise<void> {
  const { body } = req.body as CreateCommentInput;
  const comment = await service.addComment(req.params.id, req.user!.id, body);
  res.status(201).json({ data: comment } satisfies ApiResponse<CommentDTO>);
}

export async function updateComment(req: Request, res: Response): Promise<void> {
  const { body } = req.body as CreateCommentInput;
  const isAdmin = req.user!.role === 'admin';
  const comment = await service.updateComment(req.params.commentId, req.user!.id, isAdmin, body);
  res.status(200).json({ data: comment } satisfies ApiResponse<CommentDTO>);
}

export async function removeComment(req: Request, res: Response): Promise<void> {
  const isAdmin = req.user!.role === 'admin';
  await service.removeComment(req.params.commentId, req.user!.id, isAdmin);
  res.status(204).send();
}
