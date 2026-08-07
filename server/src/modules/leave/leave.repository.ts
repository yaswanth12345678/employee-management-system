import type { LeaveStatus, LeaveType } from '@ems/shared';
import { pool } from '../../db/pool';
import type { CreateLeaveInput } from './leave.validation';

export interface LeaveRow {
  id: string;
  type: LeaveType;
  status: LeaveStatus;
  start_date: string;
  end_date: string;
  reason: string | null;
  decided_at: Date | null;
  created_at: Date;
  updated_at: Date;
  emp_id: string;
  emp_code: string;
  emp_first: string;
  emp_last: string;
  emp_title: string | null;
  emp_avatar: string | null;
  app_id: string | null;
  app_code: string | null;
  app_first: string | null;
  app_last: string | null;
  app_title: string | null;
  app_avatar: string | null;
}

export interface ListParams {
  page: number;
  limit: number;
  status?: LeaveStatus;
  type?: LeaveType;
  employeeId?: string; // when set, restrict to this employee's own requests
}

const LEAVE_SELECT = `
  SELECT lr.id, lr.type, lr.status, lr.start_date::text AS start_date, lr.end_date::text AS end_date,
         lr.reason, lr.decided_at, lr.created_at, lr.updated_at,
         e.id AS emp_id, e.employee_code AS emp_code, e.first_name AS emp_first, e.last_name AS emp_last,
         e.job_title AS emp_title, e.avatar_url AS emp_avatar,
         ap.id AS app_id, ap.employee_code AS app_code, ap.first_name AS app_first, ap.last_name AS app_last,
         ap.job_title AS app_title, ap.avatar_url AS app_avatar
  FROM leave_requests lr
  JOIN employees e  ON e.id = lr.employee_id
  LEFT JOIN employees ap ON ap.id = lr.approver_id
`;

const LIST_FILTER = `
  WHERE ($1::leave_status IS NULL OR lr.status = $1)
    AND ($2::leave_type   IS NULL OR lr.type = $2)
    AND ($3::uuid IS NULL OR lr.employee_id = $3)
`;

export async function list(params: ListParams): Promise<{ rows: LeaveRow[]; total: number }> {
  const offset = (params.page - 1) * params.limit;
  const args = [params.status ?? null, params.type ?? null, params.employeeId ?? null];
  const listSql = `${LEAVE_SELECT} ${LIST_FILTER} ORDER BY lr.created_at DESC LIMIT $4 OFFSET $5`;
  const countSql = `SELECT COUNT(*)::int AS total FROM leave_requests lr ${LIST_FILTER}`;
  const [listResult, countResult] = await Promise.all([
    pool.query<LeaveRow>(listSql, [...args, params.limit, offset]),
    pool.query<{ total: number }>(countSql, args),
  ]);
  return { rows: listResult.rows, total: countResult.rows[0].total };
}

export async function findById(id: string): Promise<LeaveRow | null> {
  const { rows } = await pool.query<LeaveRow>(`${LEAVE_SELECT} WHERE lr.id = $1`, [id]);
  return rows[0] ?? null;
}

export async function findMeta(
  id: string,
): Promise<{ status: LeaveStatus; employeeId: string } | null> {
  const { rows } = await pool.query<{ status: LeaveStatus; employee_id: string }>(
    'SELECT status, employee_id FROM leave_requests WHERE id = $1',
    [id],
  );
  return rows[0] ? { status: rows[0].status, employeeId: rows[0].employee_id } : null;
}

export async function create(employeeId: string, input: CreateLeaveInput): Promise<LeaveRow> {
  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO leave_requests (employee_id, type, start_date, end_date, reason)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [employeeId, input.type, input.startDate, input.endDate, input.reason ?? null],
  );
  return (await findById(rows[0].id)) as LeaveRow;
}

/** Approve/reject: only transitions a PENDING request. Returns false if it wasn't pending. */
export async function decide(
  id: string,
  status: 'approved' | 'rejected',
  approverId: string,
): Promise<boolean> {
  const { rowCount } = await pool.query(
    `UPDATE leave_requests SET status = $2, approver_id = $3, decided_at = now()
     WHERE id = $1 AND status = 'pending'`,
    [id, status, approverId],
  );
  return (rowCount ?? 0) > 0;
}

/** Cancel: owner only, pending only. */
export async function cancel(id: string, employeeId: string): Promise<boolean> {
  const { rowCount } = await pool.query(
    `UPDATE leave_requests SET status = 'cancelled'
     WHERE id = $1 AND employee_id = $2 AND status = 'pending'`,
    [id, employeeId],
  );
  return (rowCount ?? 0) > 0;
}
