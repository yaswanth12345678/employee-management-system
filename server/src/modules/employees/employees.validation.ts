import { z } from 'zod';

const EMPLOYMENT_STATUSES = ['probation', 'active', 'on_leave', 'terminated'] as const;
const ROLE_NAMES = ['admin', 'hr', 'manager', 'employee'] as const;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const listEmployeesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().optional(),
  search: z.string().trim().optional(),
  departmentId: z.string().uuid().optional(),
  status: z.enum(EMPLOYMENT_STATUSES).optional(),
  managerId: z.string().uuid().optional(),
});
export type ListEmployeesQuery = z.infer<typeof listEmployeesQuerySchema>;

export const createEmployeeSchema = z.object({
  email: z.string().trim().email('A valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  roleName: z.enum(ROLE_NAMES),
  firstName: z.string().trim().min(1, 'First name is required').max(80),
  lastName: z.string().trim().min(1, 'Last name is required').max(80),
  jobTitle: z.string().trim().max(120).optional(),
  departmentId: z.string().uuid().nullable().optional(),
  managerId: z.string().uuid().nullable().optional(),
  hireDate: z.string().regex(DATE_RE, 'hireDate must be YYYY-MM-DD'),
  phone: z.string().trim().max(20).optional(),
  dateOfBirth: z.string().regex(DATE_RE, 'dateOfBirth must be YYYY-MM-DD').optional(),
});
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

export const updateEmployeeSchema = z.object({
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().min(1).max(80).optional(),
  jobTitle: z.string().trim().max(120).nullable().optional(),
  departmentId: z.string().uuid().nullable().optional(),
  managerId: z.string().uuid().nullable().optional(),
  status: z.enum(EMPLOYMENT_STATUSES).optional(),
  phone: z.string().trim().max(20).nullable().optional(),
  dateOfBirth: z.string().regex(DATE_RE).nullable().optional(),
});
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
