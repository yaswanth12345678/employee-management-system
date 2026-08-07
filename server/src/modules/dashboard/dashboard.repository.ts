import type { AttendanceStatus } from '@ems/shared';
import { pool } from '../../db/pool';

async function countScalar(sql: string, params: unknown[] = []): Promise<number> {
  const { rows } = await pool.query<{ count: number }>(sql, params);
  return rows[0]?.count ?? 0;
}

export function myOpenTasks(employeeId: string): Promise<number> {
  return countScalar(
    `SELECT COUNT(*)::int AS count FROM tasks WHERE assignee_id = $1 AND status <> 'done'`,
    [employeeId],
  );
}

export function myPendingLeave(employeeId: string): Promise<number> {
  return countScalar(
    `SELECT COUNT(*)::int AS count FROM leave_requests WHERE employee_id = $1 AND status = 'pending'`,
    [employeeId],
  );
}

export async function todayAttendanceStatus(employeeId: string): Promise<AttendanceStatus | null> {
  const { rows } = await pool.query<{ status: AttendanceStatus }>(
    `SELECT status FROM attendance WHERE employee_id = $1 AND work_date = CURRENT_DATE`,
    [employeeId],
  );
  return rows[0]?.status ?? null;
}

export function headcount(): Promise<number> {
  return countScalar(`SELECT COUNT(*)::int AS count FROM employees`);
}

export function onLeaveToday(): Promise<number> {
  return countScalar(
    `SELECT COUNT(DISTINCT employee_id)::int AS count FROM leave_requests
     WHERE status = 'approved' AND start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE`,
  );
}

export function activeProjects(): Promise<number> {
  return countScalar(`SELECT COUNT(*)::int AS count FROM projects WHERE status = 'active'`);
}

export function overdueProjects(): Promise<number> {
  return countScalar(
    `SELECT COUNT(*)::int AS count FROM projects
     WHERE end_date < CURRENT_DATE AND status NOT IN ('completed', 'cancelled')`,
  );
}
