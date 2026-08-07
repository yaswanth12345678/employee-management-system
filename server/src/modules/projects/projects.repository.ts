import type { PriorityLevel, ProjectStatus } from '@ems/shared';
import { pool } from '../../db/pool';
import type { CreateProjectInput, UpdateProjectInput } from './projects.validation';

export interface ProjectRow {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  priority: PriorityLevel;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  department_id: string | null;
  department_name: string | null;
  pm_id: string | null;
  pm_code: string | null;
  pm_first_name: string | null;
  pm_last_name: string | null;
  pm_job_title: string | null;
  pm_avatar_url: string | null;
  member_count: number;
  task_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface MemberRow {
  employee_id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  job_title: string | null;
  avatar_url: string | null;
  role_on_project: string | null;
  allocated_at: Date;
}

export interface ListParams {
  page: number;
  limit: number;
  sort?: string;
  search?: string;
  status?: ProjectStatus;
  priority?: PriorityLevel;
  departmentId?: string;
  managerId?: string;
}

const SORT_COLUMNS: Record<string, string> = {
  name: 'p.name',
  code: 'p.code',
  status: 'p.status',
  priority: 'p.priority',
  startDate: 'p.start_date',
  createdAt: 'p.created_at',
};

function resolveOrderBy(sort: string | undefined): string {
  const [field, dir] = (sort ?? 'createdAt:desc').split(':');
  const column = SORT_COLUMNS[field ?? ''] ?? 'p.created_at';
  return `${column} ${dir === 'asc' ? 'ASC' : 'DESC'}`;
}

const PROJECT_SELECT = `
  SELECT p.id, p.code, p.name, p.description, p.status, p.priority,
         p.start_date::text AS start_date, p.end_date::text AS end_date, p.budget::float8 AS budget,
         p.department_id, d.name AS department_name,
         pm.id AS pm_id, pm.employee_code AS pm_code, pm.first_name AS pm_first_name,
         pm.last_name AS pm_last_name, pm.job_title AS pm_job_title, pm.avatar_url AS pm_avatar_url,
         (SELECT COUNT(*)::int FROM project_members m WHERE m.project_id = p.id) AS member_count,
         (SELECT COUNT(*)::int FROM tasks t WHERE t.project_id = p.id) AS task_count,
         p.created_at, p.updated_at
  FROM projects p
  LEFT JOIN departments d  ON d.id = p.department_id
  LEFT JOIN employees   pm ON pm.id = p.project_manager_id
`;

const LIST_FILTER = `
  WHERE ($1::text IS NULL OR (p.name || ' ' || p.code) ILIKE '%' || $1 || '%')
    AND ($2::project_status IS NULL OR p.status = $2)
    AND ($3::priority_level IS NULL OR p.priority = $3)
    AND ($4::uuid IS NULL OR p.department_id = $4)
    AND ($5::uuid IS NULL OR p.project_manager_id = $5)
`;

export async function list(params: ListParams): Promise<{ rows: ProjectRow[]; total: number }> {
  const offset = (params.page - 1) * params.limit;
  const args = [
    params.search && params.search.length > 0 ? params.search : null,
    params.status ?? null,
    params.priority ?? null,
    params.departmentId ?? null,
    params.managerId ?? null,
  ];

  const listSql = `${PROJECT_SELECT} ${LIST_FILTER} ORDER BY ${resolveOrderBy(params.sort)} LIMIT $6 OFFSET $7`;
  const countSql = `SELECT COUNT(*)::int AS total FROM projects p ${LIST_FILTER}`;

  const [listResult, countResult] = await Promise.all([
    pool.query<ProjectRow>(listSql, [...args, params.limit, offset]),
    pool.query<{ total: number }>(countSql, args),
  ]);
  return { rows: listResult.rows, total: countResult.rows[0].total };
}

export async function findById(id: string): Promise<ProjectRow | null> {
  const { rows } = await pool.query<ProjectRow>(`${PROJECT_SELECT} WHERE p.id = $1`, [id]);
  return rows[0] ?? null;
}

export async function create(input: CreateProjectInput): Promise<ProjectRow> {
  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO projects (code, name, description, department_id, project_manager_id, status, priority, start_date, end_date, budget)
     VALUES ($1, $2, $3, $4, $5, COALESCE($6::project_status, 'planning'), COALESCE($7::priority_level, 'medium'), $8, $9, $10)
     RETURNING id`,
    [
      input.code,
      input.name,
      input.description ?? null,
      input.departmentId ?? null,
      input.projectManagerId ?? null,
      input.status ?? null,
      input.priority ?? null,
      input.startDate ?? null,
      input.endDate ?? null,
      input.budget ?? null,
    ],
  );
  return (await findById(rows[0].id)) as ProjectRow;
}

const UPDATABLE: Record<string, string> = {
  code: 'code',
  name: 'name',
  description: 'description',
  departmentId: 'department_id',
  projectManagerId: 'project_manager_id',
  status: 'status',
  priority: 'priority',
  startDate: 'start_date',
  endDate: 'end_date',
  budget: 'budget',
};

export async function update(id: string, input: UpdateProjectInput): Promise<ProjectRow | null> {
  const sets: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  for (const [key, column] of Object.entries(UPDATABLE)) {
    const value = (input as Record<string, unknown>)[key];
    if (value !== undefined) {
      sets.push(`${column} = $${i++}`);
      values.push(value);
    }
  }
  if (sets.length === 0) return findById(id);
  values.push(id);
  const { rowCount } = await pool.query(
    `UPDATE projects SET ${sets.join(', ')} WHERE id = $${i}`,
    values,
  );
  if (rowCount === 0) return null;
  return findById(id);
}

export async function remove(id: string): Promise<boolean> {
  const { rowCount } = await pool.query('DELETE FROM projects WHERE id = $1', [id]);
  return (rowCount ?? 0) > 0;
}

// ── Members (M:N) ────────────────────────────────────────────────────────────
export async function listMembers(projectId: string): Promise<MemberRow[]> {
  const { rows } = await pool.query<MemberRow>(
    `SELECT e.id AS employee_id, e.employee_code, e.first_name, e.last_name, e.job_title,
            e.avatar_url, m.role_on_project, m.allocated_at
     FROM project_members m
     JOIN employees e ON e.id = m.employee_id
     WHERE m.project_id = $1
     ORDER BY e.first_name`,
    [projectId],
  );
  return rows;
}

export async function addMember(
  projectId: string,
  employeeId: string,
  roleOnProject: string | null,
): Promise<void> {
  await pool.query(
    `INSERT INTO project_members (project_id, employee_id, role_on_project) VALUES ($1, $2, $3)`,
    [projectId, employeeId, roleOnProject],
  );
}

export async function removeMember(projectId: string, employeeId: string): Promise<boolean> {
  const { rowCount } = await pool.query(
    'DELETE FROM project_members WHERE project_id = $1 AND employee_id = $2',
    [projectId, employeeId],
  );
  return (rowCount ?? 0) > 0;
}

export async function projectExists(id: string): Promise<boolean> {
  const { rowCount } = await pool.query('SELECT 1 FROM projects WHERE id = $1', [id]);
  return (rowCount ?? 0) > 0;
}
