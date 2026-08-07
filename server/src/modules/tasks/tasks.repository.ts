import type { PriorityLevel, TaskStatus } from '@ems/shared';
import { pool } from '../../db/pool';
import type { CreateTaskInput, UpdateTaskInput } from './tasks.validation';

export interface TaskRow {
  id: string;
  project_id: string;
  parent_task_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: PriorityLevel;
  due_date: string | null;
  estimated_hours: number | null;
  a_id: string | null;
  a_code: string | null;
  a_first: string | null;
  a_last: string | null;
  a_title: string | null;
  a_avatar: string | null;
  r_id: string | null;
  r_code: string | null;
  r_first: string | null;
  r_last: string | null;
  r_title: string | null;
  r_avatar: string | null;
  comment_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface CommentRow {
  id: string;
  task_id: string;
  body: string;
  created_at: Date;
  updated_at: Date;
  author_id: string | null;
  author_code: string | null;
  author_first: string | null;
  author_last: string | null;
  author_title: string | null;
  author_avatar: string | null;
}

export interface ListParams {
  page: number;
  limit: number;
  sort?: string;
  search?: string;
  projectId?: string;
  assigneeId?: string;
  status?: TaskStatus;
  priority?: PriorityLevel;
}

const SORT_COLUMNS: Record<string, string> = {
  title: 't.title',
  status: 't.status',
  priority: 't.priority',
  dueDate: 't.due_date',
  createdAt: 't.created_at',
};

function resolveOrderBy(sort: string | undefined): string {
  const [field, dir] = (sort ?? 'createdAt:desc').split(':');
  const column = SORT_COLUMNS[field ?? ''] ?? 't.created_at';
  return `${column} ${dir === 'asc' ? 'ASC' : 'DESC'}`;
}

const TASK_SELECT = `
  SELECT t.id, t.project_id, t.parent_task_id, t.title, t.description, t.status, t.priority,
         t.due_date::text AS due_date, t.estimated_hours::float8 AS estimated_hours,
         a.id AS a_id, a.employee_code AS a_code, a.first_name AS a_first, a.last_name AS a_last,
         a.job_title AS a_title, a.avatar_url AS a_avatar,
         r.id AS r_id, r.employee_code AS r_code, r.first_name AS r_first, r.last_name AS r_last,
         r.job_title AS r_title, r.avatar_url AS r_avatar,
         (SELECT COUNT(*)::int FROM comments c WHERE c.task_id = t.id) AS comment_count,
         t.created_at, t.updated_at
  FROM tasks t
  LEFT JOIN employees a ON a.id = t.assignee_id
  LEFT JOIN employees r ON r.id = t.reporter_id
`;

const LIST_FILTER = `
  WHERE ($1::text IS NULL OR t.title ILIKE '%' || $1 || '%')
    AND ($2::uuid IS NULL OR t.project_id = $2)
    AND ($3::uuid IS NULL OR t.assignee_id = $3)
    AND ($4::task_status IS NULL OR t.status = $4)
    AND ($5::priority_level IS NULL OR t.priority = $5)
`;

export async function list(params: ListParams): Promise<{ rows: TaskRow[]; total: number }> {
  const offset = (params.page - 1) * params.limit;
  const args = [
    params.search && params.search.length > 0 ? params.search : null,
    params.projectId ?? null,
    params.assigneeId ?? null,
    params.status ?? null,
    params.priority ?? null,
  ];
  const listSql = `${TASK_SELECT} ${LIST_FILTER} ORDER BY ${resolveOrderBy(params.sort)} LIMIT $6 OFFSET $7`;
  const countSql = `SELECT COUNT(*)::int AS total FROM tasks t ${LIST_FILTER}`;
  const [listResult, countResult] = await Promise.all([
    pool.query<TaskRow>(listSql, [...args, params.limit, offset]),
    pool.query<{ total: number }>(countSql, args),
  ]);
  return { rows: listResult.rows, total: countResult.rows[0].total };
}

export async function findById(id: string): Promise<TaskRow | null> {
  const { rows } = await pool.query<TaskRow>(`${TASK_SELECT} WHERE t.id = $1`, [id]);
  return rows[0] ?? null;
}

export async function create(input: CreateTaskInput): Promise<TaskRow> {
  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO tasks (project_id, parent_task_id, title, description, assignee_id, reporter_id, status, priority, due_date, estimated_hours)
     VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7::task_status, 'todo'), COALESCE($8::priority_level, 'medium'), $9, $10)
     RETURNING id`,
    [
      input.projectId,
      input.parentTaskId ?? null,
      input.title,
      input.description ?? null,
      input.assigneeId ?? null,
      input.reporterId ?? null,
      input.status ?? null,
      input.priority ?? null,
      input.dueDate ?? null,
      input.estimatedHours ?? null,
    ],
  );
  return (await findById(rows[0].id)) as TaskRow;
}

const UPDATABLE: Record<string, string> = {
  title: 'title',
  description: 'description',
  assigneeId: 'assignee_id',
  reporterId: 'reporter_id',
  status: 'status',
  priority: 'priority',
  dueDate: 'due_date',
  estimatedHours: 'estimated_hours',
};

export async function update(id: string, input: UpdateTaskInput): Promise<TaskRow | null> {
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
  const { rowCount } = await pool.query(`UPDATE tasks SET ${sets.join(', ')} WHERE id = $${i}`, values);
  if (rowCount === 0) return null;
  return findById(id);
}

export async function updateStatus(id: string, status: TaskStatus): Promise<TaskRow | null> {
  const { rowCount } = await pool.query('UPDATE tasks SET status = $1 WHERE id = $2', [status, id]);
  if (rowCount === 0) return null;
  return findById(id);
}

export async function remove(id: string): Promise<boolean> {
  const { rowCount } = await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
  return (rowCount ?? 0) > 0;
}

export async function taskExists(id: string): Promise<boolean> {
  const { rowCount } = await pool.query('SELECT 1 FROM tasks WHERE id = $1', [id]);
  return (rowCount ?? 0) > 0;
}

// ── Comments ────────────────────────────────────────────────────────────────
const COMMENT_SELECT = `
  SELECT c.id, c.task_id, c.body, c.created_at, c.updated_at,
         e.id AS author_id, e.employee_code AS author_code, e.first_name AS author_first,
         e.last_name AS author_last, e.job_title AS author_title, e.avatar_url AS author_avatar
  FROM comments c
  LEFT JOIN employees e ON e.id = c.author_id
`;

export async function findEmployeeIdByUserId(userId: string): Promise<string | null> {
  const { rows } = await pool.query<{ id: string }>('SELECT id FROM employees WHERE user_id = $1', [userId]);
  return rows[0]?.id ?? null;
}

export async function listComments(taskId: string): Promise<CommentRow[]> {
  const { rows } = await pool.query<CommentRow>(
    `${COMMENT_SELECT} WHERE c.task_id = $1 ORDER BY c.created_at ASC`,
    [taskId],
  );
  return rows;
}

export async function addComment(taskId: string, authorId: string, body: string): Promise<CommentRow> {
  const { rows } = await pool.query<{ id: string }>(
    'INSERT INTO comments (task_id, author_id, body) VALUES ($1, $2, $3) RETURNING id',
    [taskId, authorId, body],
  );
  const { rows: full } = await pool.query<CommentRow>(`${COMMENT_SELECT} WHERE c.id = $1`, [rows[0].id]);
  return full[0];
}

export async function findCommentAuthor(commentId: string): Promise<string | null | undefined> {
  const { rows } = await pool.query<{ author_id: string | null }>(
    'SELECT author_id FROM comments WHERE id = $1',
    [commentId],
  );
  return rows.length === 0 ? undefined : rows[0].author_id;
}

export async function updateComment(commentId: string, body: string): Promise<CommentRow | null> {
  const { rowCount } = await pool.query('UPDATE comments SET body = $1 WHERE id = $2', [body, commentId]);
  if (rowCount === 0) return null;
  const { rows } = await pool.query<CommentRow>(`${COMMENT_SELECT} WHERE c.id = $1`, [commentId]);
  return rows[0] ?? null;
}

export async function removeComment(commentId: string): Promise<boolean> {
  const { rowCount } = await pool.query('DELETE FROM comments WHERE id = $1', [commentId]);
  return (rowCount ?? 0) > 0;
}
