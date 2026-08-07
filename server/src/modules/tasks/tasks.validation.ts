import { z } from 'zod';

const TASK_STATUSES = ['todo', 'in_progress', 'in_review', 'blocked', 'done'] as const;
const PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const listTasksQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().optional(),
  search: z.string().trim().optional(),
  projectId: z.string().uuid().optional(),
  assigneeId: z.string().uuid().optional(),
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
});
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;

export const createTaskSchema = z.object({
  projectId: z.string().uuid('projectId is required'),
  title: z.string().trim().min(2, 'Title must be at least 2 characters').max(200),
  description: z.string().trim().max(4000).optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  reporterId: z.string().uuid().nullable().optional(),
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  dueDate: z.string().regex(DATE_RE).nullable().optional(),
  estimatedHours: z.coerce.number().nonnegative().nullable().optional(),
  parentTaskId: z.string().uuid().nullable().optional(),
});
export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z.object({
  title: z.string().trim().min(2).max(200).optional(),
  description: z.string().trim().max(4000).nullable().optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  reporterId: z.string().uuid().nullable().optional(),
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  dueDate: z.string().regex(DATE_RE).nullable().optional(),
  estimatedHours: z.coerce.number().nonnegative().nullable().optional(),
});
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const updateStatusSchema = z.object({ status: z.enum(TASK_STATUSES) });
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;

export const createCommentSchema = z.object({ body: z.string().trim().min(1, 'Comment cannot be empty').max(4000) });
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
