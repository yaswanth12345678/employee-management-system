import { z } from 'zod';

/** Single-mode form (create & edit share the same fields). budget is a text input → parsed to a number on submit. */
export const projectFormSchema = z.object({
  code: z.string().trim().min(2, 'Code is required').max(20),
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(160),
  description: z.string().trim().max(2000).optional(),
  departmentId: z.string().optional(),
  projectManagerId: z.string().optional(),
  status: z.enum(['planning', 'active', 'on_hold', 'completed', 'cancelled']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  budget: z.string().optional(),
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;

export const projectMemberSchema = z.object({
  employeeId: z.string().min(1, 'Employee is required'),
  roleOnProject: z.string().trim().max(80).optional(),
});

export type ProjectMemberValues = z.infer<typeof projectMemberSchema>;
