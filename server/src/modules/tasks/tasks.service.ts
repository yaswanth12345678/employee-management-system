import type { CommentDTO, PaginatedResponse, RoleName, TaskDTO, TaskStatus } from '@ems/shared';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../../common/errors';
import { buildPaginationMeta } from '../../common/http/pagination';
import { PG_ERROR, pgErrorCode } from '../../common/db/pgErrors';
import { emitToAll } from '../../realtime/realtime';
import * as repo from './tasks.repository';
import type { CommentRow, ListParams, TaskRow } from './tasks.repository';
import type { CreateTaskInput, UpdateTaskInput } from './tasks.validation';

function summary(
  id: string | null,
  code: string | null,
  first: string | null,
  last: string | null,
  jobTitle: string | null,
  avatar: string | null,
) {
  return id
    ? {
        id,
        employeeCode: code ?? '',
        firstName: first ?? '',
        lastName: last ?? '',
        jobTitle: jobTitle ?? undefined,
        avatarUrl: avatar ?? undefined,
      }
    : null;
}

function toDTO(row: TaskRow): TaskDTO {
  return {
    id: row.id,
    projectId: row.project_id,
    parentTaskId: row.parent_task_id,
    title: row.title,
    description: row.description ?? undefined,
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date ?? undefined,
    estimatedHours: row.estimated_hours ?? undefined,
    assignee: summary(row.a_id, row.a_code, row.a_first, row.a_last, row.a_title, row.a_avatar),
    reporter: summary(row.r_id, row.r_code, row.r_first, row.r_last, row.r_title, row.r_avatar),
    commentCount: row.comment_count,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function commentToDTO(row: CommentRow): CommentDTO {
  return {
    id: row.id,
    taskId: row.task_id,
    body: row.body,
    author: summary(row.author_id, row.author_code, row.author_first, row.author_last, row.author_title, row.author_avatar),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function translateWriteError(err: unknown): never {
  if (pgErrorCode(err) === PG_ERROR.FOREIGN_KEY_VIOLATION) {
    throw new ValidationError('Referenced project, assignee, or reporter does not exist');
  }
  throw err;
}

export async function list(params: ListParams): Promise<PaginatedResponse<TaskDTO>> {
  const { rows, total } = await repo.list(params);
  return { data: rows.map(toDTO), meta: { pagination: buildPaginationMeta(params.page, params.limit, total) } };
}

export async function getById(id: string): Promise<TaskDTO> {
  const row = await repo.findById(id);
  if (!row) throw new NotFoundError('Task not found');
  return toDTO(row);
}

export async function create(input: CreateTaskInput): Promise<TaskDTO> {
  try {
    return toDTO(await repo.create(input));
  } catch (err) {
    return translateWriteError(err);
  }
}

export async function update(id: string, input: UpdateTaskInput): Promise<TaskDTO> {
  let row: TaskRow | null;
  try {
    row = await repo.update(id, input);
  } catch (err) {
    return translateWriteError(err);
  }
  if (!row) throw new NotFoundError('Task not found');
  return toDTO(row);
}

export async function updateStatus(
  id: string,
  status: TaskStatus,
  userId: string,
  role: RoleName,
): Promise<TaskDTO> {
  const current = await repo.findById(id);
  if (!current) throw new NotFoundError('Task not found');

  // Managers/admins may change any task; everyone else only their own assigned/reported tasks.
  if (role !== 'admin' && role !== 'manager') {
    const employeeId = await repo.findEmployeeIdByUserId(userId);
    if (!employeeId || (current.a_id !== employeeId && current.r_id !== employeeId)) {
      throw new ForbiddenError('You can only change the status of tasks assigned to or reported by you');
    }
  }

  const row = await repo.updateStatus(id, status);
  if (!row) throw new NotFoundError('Task not found');
  // Broadcast a lightweight "refresh your board" signal to connected clients.
  emitToAll({ type: 'task_updated', taskId: id, status });
  return toDTO(row);
}

export async function remove(id: string): Promise<void> {
  if (!(await repo.remove(id))) throw new NotFoundError('Task not found');
}

// ── Comments ────────────────────────────────────────────────────────────────
export async function listComments(taskId: string): Promise<CommentDTO[]> {
  if (!(await repo.taskExists(taskId))) throw new NotFoundError('Task not found');
  return (await repo.listComments(taskId)).map(commentToDTO);
}

export async function addComment(taskId: string, userId: string, body: string): Promise<CommentDTO> {
  if (!(await repo.taskExists(taskId))) throw new NotFoundError('Task not found');
  const authorId = await repo.findEmployeeIdByUserId(userId);
  if (!authorId) throw new ValidationError('Only users with an employee profile can comment');
  try {
    return commentToDTO(await repo.addComment(taskId, authorId, body));
  } catch (err) {
    if (pgErrorCode(err) === PG_ERROR.FOREIGN_KEY_VIOLATION) throw new ConflictError('Task no longer exists');
    throw err;
  }
}

async function assertCommentOwnerOrAdmin(commentId: string, userId: string, isAdmin: boolean): Promise<void> {
  const authorId = await repo.findCommentAuthor(commentId);
  if (authorId === undefined) throw new NotFoundError('Comment not found');
  if (isAdmin) return;
  const employeeId = await repo.findEmployeeIdByUserId(userId);
  if (!employeeId || employeeId !== authorId) {
    throw new ForbiddenError('You can only modify your own comments');
  }
}

export async function updateComment(
  commentId: string,
  userId: string,
  isAdmin: boolean,
  body: string,
): Promise<CommentDTO> {
  await assertCommentOwnerOrAdmin(commentId, userId, isAdmin);
  const row = await repo.updateComment(commentId, body);
  if (!row) throw new NotFoundError('Comment not found');
  return commentToDTO(row);
}

export async function removeComment(commentId: string, userId: string, isAdmin: boolean): Promise<void> {
  await assertCommentOwnerOrAdmin(commentId, userId, isAdmin);
  if (!(await repo.removeComment(commentId))) throw new NotFoundError('Comment not found');
}
