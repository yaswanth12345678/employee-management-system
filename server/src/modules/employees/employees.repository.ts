import type { EmploymentStatus, RoleName } from '@ems/shared';
import { pool } from '../../db/pool';
import type { UpdateEmployeeInput } from './employees.validation';

/** Raw row shape from the employee queries (employee + user + role + department + manager). */
export interface EmployeeRow {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  job_title: string | null;
  status: EmploymentStatus;
  hire_date: string;
  date_of_birth: string | null;
  avatar_url: string | null;
  department_id: string | null;
  manager_id: string | null;
  email: string;
  is_active: boolean;
  role_name: RoleName;
  department_name: string | null;
  manager_emp_id: string | null;
  manager_code: string | null;
  manager_first_name: string | null;
  manager_last_name: string | null;
  manager_job_title: string | null;
  manager_avatar_url: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ListParams {
  page: number;
  limit: number;
  sort?: string;
  search?: string;
  departmentId?: string;
  status?: EmploymentStatus;
  managerId?: string;
}

export interface CreateEmployeeData {
  email: string;
  passwordHash: string;
  roleName: RoleName;
  firstName: string;
  lastName: string;
  jobTitle?: string | null;
  departmentId?: string | null;
  managerId?: string | null;
  hireDate: string;
  phone?: string | null;
  dateOfBirth?: string | null;
}

const SORT_COLUMNS: Record<string, string> = {
  name: 'e.first_name',
  employeeCode: 'e.employee_code',
  hireDate: 'e.hire_date',
  status: 'e.status',
  createdAt: 'e.created_at',
};

function resolveOrderBy(sort: string | undefined): string {
  const [field, dir] = (sort ?? 'name:asc').split(':');
  const column = SORT_COLUMNS[field ?? ''] ?? 'e.first_name';
  const direction = dir === 'desc' ? 'DESC' : 'ASC';
  return `${column} ${direction}`;
}

// Dates cast to ::text to avoid JS Date/timezone drift on DATE columns.
const EMPLOYEE_SELECT = `
  SELECT e.id, e.employee_code, e.first_name, e.last_name, e.phone, e.job_title,
         e.status, e.hire_date::text AS hire_date, e.date_of_birth::text AS date_of_birth,
         e.avatar_url, e.department_id, e.manager_id, e.created_at, e.updated_at,
         u.email, u.is_active, r.name AS role_name,
         d.name AS department_name,
         m.id AS manager_emp_id, m.employee_code AS manager_code,
         m.first_name AS manager_first_name, m.last_name AS manager_last_name,
         m.job_title AS manager_job_title, m.avatar_url AS manager_avatar_url
  FROM employees e
  JOIN users u  ON u.id = e.user_id
  JOIN roles r  ON r.id = u.role_id
  LEFT JOIN departments d ON d.id = e.department_id
  LEFT JOIN employees   m ON m.id = e.manager_id
`;

const LIST_FILTER = `
  WHERE ($1::text IS NULL
         OR (e.first_name || ' ' || e.last_name || ' ' || e.employee_code || ' ' || u.email) ILIKE '%' || $1 || '%')
    AND ($2::uuid IS NULL OR e.department_id = $2)
    AND ($3::employment_status IS NULL OR e.status = $3)
    AND ($4::uuid IS NULL OR e.manager_id = $4)
`;

export async function list(params: ListParams): Promise<{ rows: EmployeeRow[]; total: number }> {
  const offset = (params.page - 1) * params.limit;
  const args = [
    params.search && params.search.length > 0 ? params.search : null,
    params.departmentId ?? null,
    params.status ?? null,
    params.managerId ?? null,
  ];

  const listSql = `${EMPLOYEE_SELECT} ${LIST_FILTER} ORDER BY ${resolveOrderBy(params.sort)} LIMIT $5 OFFSET $6`;
  const countSql = `
    SELECT COUNT(*)::int AS total
    FROM employees e
    JOIN users u ON u.id = e.user_id
    ${LIST_FILTER}
  `;

  const [listResult, countResult] = await Promise.all([
    pool.query<EmployeeRow>(listSql, [...args, params.limit, offset]),
    pool.query<{ total: number }>(countSql, args),
  ]);

  return { rows: listResult.rows, total: countResult.rows[0].total };
}

export async function findById(id: string): Promise<EmployeeRow | null> {
  const { rows } = await pool.query<EmployeeRow>(`${EMPLOYEE_SELECT} WHERE e.id = $1`, [id]);
  return rows[0] ?? null;
}

/**
 * Create a user + employee atomically. If ANY step fails (duplicate email, bad FK), the whole
 * transaction rolls back — you never end up with a user that has no employee, or vice versa.
 * This is exactly what transactions are for: multiple writes that must all succeed or all fail.
 */
export async function createWithUser(data: CreateEmployeeData): Promise<string> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const roleResult = await client.query<{ id: string }>(
      'SELECT id FROM roles WHERE name = $1',
      [data.roleName],
    );
    if (roleResult.rows.length === 0) {
      throw new Error(`Unknown role: ${data.roleName}`);
    }

    const userResult = await client.query<{ id: string }>(
      'INSERT INTO users (email, password_hash, role_id) VALUES ($1, $2, $3) RETURNING id',
      [data.email, data.passwordHash, roleResult.rows[0].id],
    );
    const userId = userResult.rows[0].id;

    const employeeResult = await client.query<{ id: string }>(
      `INSERT INTO employees
         (user_id, employee_code, first_name, last_name, phone, job_title,
          department_id, manager_id, hire_date, date_of_birth)
       VALUES ($1, 'EMP-' || LPAD(nextval('employee_code_seq')::text, 5, '0'),
               $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        userId,
        data.firstName,
        data.lastName,
        data.phone ?? null,
        data.jobTitle ?? null,
        data.departmentId ?? null,
        data.managerId ?? null,
        data.hireDate,
        data.dateOfBirth ?? null,
      ],
    );

    await client.query('INSERT INTO user_settings (user_id) VALUES ($1) ON CONFLICT DO NOTHING', [
      userId,
    ]);

    await client.query('COMMIT');
    return employeeResult.rows[0].id;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

const UPDATABLE_COLUMNS: Record<keyof UpdateEmployeeInput, string> = {
  firstName: 'first_name',
  lastName: 'last_name',
  jobTitle: 'job_title',
  departmentId: 'department_id',
  managerId: 'manager_id',
  status: 'status',
  phone: 'phone',
  dateOfBirth: 'date_of_birth',
};

export async function update(id: string, input: UpdateEmployeeInput): Promise<EmployeeRow | null> {
  const sets: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  for (const [key, column] of Object.entries(UPDATABLE_COLUMNS)) {
    const value = input[key as keyof UpdateEmployeeInput];
    if (value !== undefined) {
      sets.push(`${column} = $${i++}`);
      values.push(value);
    }
  }

  if (sets.length === 0) {
    return findById(id);
  }

  values.push(id);
  const { rowCount } = await pool.query(
    `UPDATE employees SET ${sets.join(', ')} WHERE id = $${i}`,
    values,
  );
  if (rowCount === 0) {
    return null;
  }
  return findById(id);
}

export async function remove(id: string): Promise<boolean> {
  // Delete the user; ON DELETE CASCADE removes the employee (and dependent rows). If the
  // employee manages a project (projects.project_manager_id ON DELETE RESTRICT), this fails
  // with a FK violation — surfaced as 409 by the service.
  const { rowCount } = await pool.query(
    'DELETE FROM users WHERE id = (SELECT user_id FROM employees WHERE id = $1)',
    [id],
  );
  return (rowCount ?? 0) > 0;
}

/** Resolve the employee id for a given user id (null if the user has no employee profile). */
export async function findEmployeeIdByUserId(userId: string): Promise<string | null> {
  const { rows } = await pool.query<{ id: string }>('SELECT id FROM employees WHERE user_id = $1', [
    userId,
  ]);
  return rows[0]?.id ?? null;
}
