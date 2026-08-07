import { z } from 'zod';

const PROJECT_STATUSES = ['planning', 'active', 'on_hold', 'completed', 'cancelled'] as const;
const PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const listProjectsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().optional(),
  search: z.string().trim().optional(),
  status: z.enum(PROJECT_STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  departmentId: z.string().uuid().optional(),
  managerId: z.string().uuid().optional(),
});
export type ListProjectsQuery = z.infer<typeof listProjectsQuerySchema>;

export const createProjectSchema = z.object({
  code: z.string().trim().min(2, 'Code is required').max(20),
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(160),
  description: z.string().trim().max(2000).optional(),
  departmentId: z.string().uuid().nullable().optional(),
  projectManagerId: z.string().uuid().nullable().optional(),
  status: z.enum(PROJECT_STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  startDate: z.string().regex(DATE_RE, 'startDate must be YYYY-MM-DD').nullable().optional(),
  endDate: z.string().regex(DATE_RE, 'endDate must be YYYY-MM-DD').nullable().optional(),
  budget: z.coerce.number().nonnegative().nullable().optional(),
});
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = createProjectSchema.partial();
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export const addMemberSchema = z.object({
  employeeId: z.string().uuid('employeeId must be a valid id'),
  roleOnProject: z.string().trim().max(80).optional(),
});
export type AddMemberInput = z.infer<typeof addMemberSchema>;
