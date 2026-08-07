import type { CountByKey } from '@ems/shared';
import { pool } from '../../db/pool';

interface DateRange {
  from?: string;
  to?: string;
}

export async function attendanceByStatus(range: DateRange): Promise<CountByKey[]> {
  const { rows } = await pool.query<CountByKey>(
    `SELECT status AS key, COUNT(*)::int AS count
     FROM attendance
     WHERE ($1::date IS NULL OR work_date >= $1) AND ($2::date IS NULL OR work_date <= $2)
     GROUP BY status ORDER BY count DESC`,
    [range.from ?? null, range.to ?? null],
  );
  return rows;
}

export async function leaveByStatus(range: DateRange): Promise<CountByKey[]> {
  const { rows } = await pool.query<CountByKey>(
    `SELECT status AS key, COUNT(*)::int AS count
     FROM leave_requests
     WHERE ($1::date IS NULL OR end_date >= $1) AND ($2::date IS NULL OR start_date <= $2)
     GROUP BY status ORDER BY count DESC`,
    [range.from ?? null, range.to ?? null],
  );
  return rows;
}

export async function leaveByType(range: DateRange): Promise<CountByKey[]> {
  const { rows } = await pool.query<CountByKey>(
    `SELECT type AS key, COUNT(*)::int AS count
     FROM leave_requests
     WHERE ($1::date IS NULL OR end_date >= $1) AND ($2::date IS NULL OR start_date <= $2)
     GROUP BY type ORDER BY count DESC`,
    [range.from ?? null, range.to ?? null],
  );
  return rows;
}

export async function projectByStatus(): Promise<CountByKey[]> {
  const { rows } = await pool.query<CountByKey>(
    `SELECT status AS key, COUNT(*)::int AS count FROM projects GROUP BY status ORDER BY count DESC`,
  );
  return rows;
}

export async function headcountTotal(): Promise<number> {
  const { rows } = await pool.query<{ count: number }>('SELECT COUNT(*)::int AS count FROM employees');
  return rows[0].count;
}

export async function headcountByDepartment(): Promise<CountByKey[]> {
  const { rows } = await pool.query<CountByKey>(
    `SELECT COALESCE(d.name, 'Unassigned') AS key, COUNT(e.id)::int AS count
     FROM employees e
     LEFT JOIN departments d ON d.id = e.department_id
     GROUP BY d.name ORDER BY count DESC`,
  );
  return rows;
}

export async function headcountByStatus(): Promise<CountByKey[]> {
  const { rows } = await pool.query<CountByKey>(
    `SELECT status AS key, COUNT(*)::int AS count FROM employees GROUP BY status ORDER BY count DESC`,
  );
  return rows;
}
