import { pool } from '../../db/pool';
import type { CreateDepartmentInput, UpdateDepartmentInput } from './departments.validation';

/** Raw row shape returned by the department queries (snake_case, as stored). */
export interface DepartmentRow {
  id: string;
  name: string;
  description: string | null;
  head_id: string | null;
  head_employee_code: string | null;
  head_first_name: string | null;
  head_last_name: string | null;
  head_job_title: string | null;
  head_avatar_url: string | null;
  employee_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface ListParams {
  page: number;
  limit: number;
  sort?: string;
  search?: string;
}

// Whitelist of sortable fields → real columns. NEVER interpolate a client string as a column
// name directly (SQL injection); we map through this table so only known columns are possible.
const SORT_COLUMNS: Record<string, string> = {
  name: 'd.name',
  createdAt: 'd.created_at',
  employeeCount: 'employee_count',
};

function resolveOrderBy(sort: string | undefined): string {
  const [field, dir] = (sort ?? 'name:asc').split(':');
  const column = SORT_COLUMNS[field ?? ''] ?? 'd.name';
  const direction = dir === 'desc' ? 'DESC' : 'ASC';
  return `${column} ${direction}`;
}

// Shared projection: department + its head (LEFT JOIN) + a live employee count (subquery).
const DEPARTMENT_SELECT = `
  SELECT d.id, d.name, d.description, d.head_id,
         he.employee_code AS head_employee_code,
         he.first_name    AS head_first_name,
         he.last_name     AS head_last_name,
         he.job_title     AS head_job_title,
         he.avatar_url    AS head_avatar_url,
         (SELECT COUNT(*)::int FROM employees e WHERE e.department_id = d.id) AS employee_count,
         d.created_at, d.updated_at
  FROM departments d
  LEFT JOIN employees he ON he.id = d.head_id
`;

export async function list(params: ListParams): Promise<{ rows: DepartmentRow[]; total: number }> {
  const offset = (params.page - 1) * params.limit;
  const search = params.search && params.search.length > 0 ? params.search : null;
  const orderBy = resolveOrderBy(params.sort);

  const listSql = `
    ${DEPARTMENT_SELECT}
    WHERE ($1::text IS NULL OR d.name ILIKE '%' || $1 || '%')
    ORDER BY ${orderBy}
    LIMIT $2 OFFSET $3
  `;
  const countSql = `
    SELECT COUNT(*)::int AS total
    FROM departments d
    WHERE ($1::text IS NULL OR d.name ILIKE '%' || $1 || '%')
  `;

  const [listResult, countResult] = await Promise.all([
    pool.query<DepartmentRow>(listSql, [search, params.limit, offset]),
    pool.query<{ total: number }>(countSql, [search]),
  ]);

  return { rows: listResult.rows, total: countResult.rows[0].total };
}

export async function findById(id: string): Promise<DepartmentRow | null> {
  const { rows } = await pool.query<DepartmentRow>(`${DEPARTMENT_SELECT} WHERE d.id = $1`, [id]);
  return rows[0] ?? null;
}

export async function create(input: CreateDepartmentInput): Promise<DepartmentRow> {
  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO departments (name, description, head_id) VALUES ($1, $2, $3) RETURNING id`,
    [input.name, input.description ?? null, input.headId ?? null],
  );
  // Re-select through the shared projection so the returned shape includes head + count.
  const created = await findById(rows[0].id);
  return created as DepartmentRow;
}

export async function update(id: string, input: UpdateDepartmentInput): Promise<DepartmentRow | null> {
  // Build a partial UPDATE: only the provided fields are touched.
  const sets: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  if (input.name !== undefined) {
    sets.push(`name = $${i++}`);
    values.push(input.name);
  }
  if (input.description !== undefined) {
    sets.push(`description = $${i++}`);
    values.push(input.description);
  }
  if (input.headId !== undefined) {
    sets.push(`head_id = $${i++}`);
    values.push(input.headId);
  }

  if (sets.length === 0) {
    return findById(id); // nothing to change
  }

  values.push(id);
  const { rowCount } = await pool.query(
    `UPDATE departments SET ${sets.join(', ')} WHERE id = $${i}`,
    values,
  );
  if (rowCount === 0) {
    return null;
  }
  return findById(id);
}

export async function remove(id: string): Promise<boolean> {
  const { rowCount } = await pool.query('DELETE FROM departments WHERE id = $1', [id]);
  return (rowCount ?? 0) > 0;
}
