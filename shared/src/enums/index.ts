/**
 * Enumerated value sets shared by the client and server.
 *
 * These MUST stay in sync with the PostgreSQL `CREATE TYPE ... AS ENUM` definitions
 * in server/db/migrations/001_init.sql. They are the single source of truth for
 * the allowed values of each field across the whole stack.
 */

export type RoleName = 'admin' | 'hr' | 'manager' | 'employee';

export type EmploymentStatus = 'probation' | 'active' | 'on_leave' | 'terminated';

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';

export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'blocked' | 'done';

export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day' | 'remote';

export type LeaveType = 'annual' | 'sick' | 'casual' | 'unpaid' | 'maternity' | 'paternity';

export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export type NotificationType =
  | 'task_assigned'
  | 'task_updated'
  | 'leave_status'
  | 'project_update'
  | 'mention'
  | 'system';
