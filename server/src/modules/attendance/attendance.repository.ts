import type { AttendanceStatus } from '@ems/shared';
import { pool } from '../../db/pool';

export interface AttendanceRow {
  id: string;
  employee_id: string;
  work_date: string;
  check_in_at: Date | null;
  check_out_at: Date | null;
  status: AttendanceStatus;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
  emp_code: string;
  emp_first: string;
  emp_last: string;
  emp_title: string | null;
  emp_avatar: string | null;
}

export interface ListParams {
  page: number;
  limit: number;
  employeeId?: string;
  from?: string;
  to?: string;
}

const ATTENDANCE_SELECT = `
  SELECT at.id, at.employee_id, at.work_date::text AS work_date, at.check_in_at, at.check_out_at,
         at.status, at.notes, at.created_at, at.updated_at,
         e.employee_code AS emp_code, e.first_name AS emp_first, e.last_name AS emp_last,
         e.job_title AS emp_title, e.avatar_url AS emp_avatar
  FROM attendance at
  JOIN employees e ON e.id = at.employee_id
`;

const LIST_FILTER = `
  WHERE ($1::uuid IS NULL OR at.employee_id = $1)
    AND ($2::date IS NULL OR at.work_date >= $2)
    AND ($3::date IS NULL OR at.work_date <= $3)
`;

export async function list(params: ListParams): Promise<{ rows: AttendanceRow[]; total: number }> {
  const offset = (params.page - 1) * params.limit;
  const args = [params.employeeId ?? null, params.from ?? null, params.to ?? null];
  const listSql = `${ATTENDANCE_SELECT} ${LIST_FILTER} ORDER BY at.work_date DESC LIMIT $4 OFFSET $5`;
  const countSql = `SELECT COUNT(*)::int AS total FROM attendance at ${LIST_FILTER}`;
  const [listResult, countResult] = await Promise.all([
    pool.query<AttendanceRow>(listSql, [...args, params.limit, offset]),
    pool.query<{ total: number }>(countSql, args),
  ]);
  return { rows: listResult.rows, total: countResult.rows[0].total };
}

export async function findById(id: string): Promise<AttendanceRow | null> {
  const { rows } = await pool.query<AttendanceRow>(`${ATTENDANCE_SELECT} WHERE at.id = $1`, [id]);
  return rows[0] ?? null;
}

export async function checkIn(
  employeeId: string,
  status: AttendanceStatus | null,
  notes: string | null,
): Promise<AttendanceRow> {
  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO attendance (employee_id, work_date, check_in_at, status, notes)
     VALUES ($1, CURRENT_DATE, now(), COALESCE($2::attendance_status, 'present'), $3)
     RETURNING id`,
    [employeeId, status, notes],
  );
  return (await findById(rows[0].id)) as AttendanceRow;
}

export async function checkOut(employeeId: string): Promise<AttendanceRow | null> {
  const { rows } = await pool.query<{ id: string }>(
    `UPDATE attendance SET check_out_at = now()
     WHERE employee_id = $1 AND work_date = CURRENT_DATE AND check_out_at IS NULL
     RETURNING id`,
    [employeeId],
  );
  if (rows.length === 0) return null;
  return findById(rows[0].id);
}

export async function todayRecord(employeeId: string): Promise<AttendanceRow | null> {
  const { rows } = await pool.query<AttendanceRow>(
    `${ATTENDANCE_SELECT} WHERE at.employee_id = $1 AND at.work_date = CURRENT_DATE`,
    [employeeId],
  );
  return rows[0] ?? null;
}
