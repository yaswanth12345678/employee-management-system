import { z } from 'zod';
import type { EmploymentStatus, RoleName } from '@ems/shared';

/**
 * The employee form is dual-mode. Rather than juggle two form types, we use ONE superset of
 * values (all strings) and pick the schema by mode. zod strips keys it doesn't know, so the
 * create schema validates create-only fields (email/password/role/hireDate) and the edit schema
 * validates the editable subset (+ status) — each mode gets exactly the validation it needs.
 */
export interface EmployeeFormValues {
  email: string;
  password: string;
  roleName: RoleName;
  firstName: string;
  lastName: string;
  jobTitle: string;
  departmentId: string;
  managerId: string;
  hireDate: string;
  phone: string;
  status: EmploymentStatus;
}

const optionalText = z.string().trim().max(120).optional();

export const createEmployeeFormSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  roleName: z.enum(['admin', 'hr', 'manager', 'employee']),
  firstName: z.string().trim().min(1, 'First name is required').max(80),
  lastName: z.string().trim().min(1, 'Last name is required').max(80),
  jobTitle: optionalText,
  departmentId: z.string().optional(),
  managerId: z.string().optional(),
  hireDate: z.string().min(1, 'Hire date is required'),
  phone: z.string().trim().max(20).optional(),
});

export const editEmployeeFormSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(80),
  lastName: z.string().trim().min(1, 'Last name is required').max(80),
  jobTitle: optionalText,
  departmentId: z.string().optional(),
  managerId: z.string().optional(),
  phone: z.string().trim().max(20).optional(),
  status: z.enum(['probation', 'active', 'on_leave', 'terminated']),
});
