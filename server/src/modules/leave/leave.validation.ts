import { z } from 'zod';

const LEAVE_TYPES = ['annual', 'sick', 'casual', 'unpaid', 'maternity', 'paternity'] as const;
const LEAVE_STATUSES = ['pending', 'approved', 'rejected', 'cancelled'] as const;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const listLeaveQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().optional(),
  status: z.enum(LEAVE_STATUSES).optional(),
  type: z.enum(LEAVE_TYPES).optional(),
});
export type ListLeaveQuery = z.infer<typeof listLeaveQuerySchema>;

export const createLeaveSchema = z.object({
  type: z.enum(LEAVE_TYPES),
  startDate: z.string().regex(DATE_RE, 'startDate must be YYYY-MM-DD'),
  endDate: z.string().regex(DATE_RE, 'endDate must be YYYY-MM-DD'),
  reason: z.string().trim().max(1000).optional(),
});
export type CreateLeaveInput = z.infer<typeof createLeaveSchema>;
