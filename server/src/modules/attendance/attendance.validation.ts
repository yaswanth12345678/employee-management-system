import { z } from 'zod';

const ATTENDANCE_STATUSES = ['present', 'absent', 'late', 'half_day', 'remote'] as const;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const checkInSchema = z.object({
  status: z.enum(ATTENDANCE_STATUSES).optional(),
  notes: z.string().trim().max(500).optional(),
});
export type CheckInInput = z.infer<typeof checkInSchema>;

export const listAttendanceQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  employeeId: z.string().uuid().optional(),
  from: z.string().regex(DATE_RE).optional(),
  to: z.string().regex(DATE_RE).optional(),
});
export type ListAttendanceQuery = z.infer<typeof listAttendanceQuerySchema>;
