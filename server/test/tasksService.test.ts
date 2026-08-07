import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/modules/tasks/tasks.repository', () => ({
  findById: vi.fn(),
  updateStatus: vi.fn(),
  findEmployeeIdByUserId: vi.fn(),
  findCommentAuthor: vi.fn(),
  updateComment: vi.fn(),
  removeComment: vi.fn(),
}));
vi.mock('../src/realtime/realtime', () => ({ emitToAll: vi.fn() }));

import * as repo from '../src/modules/tasks/tasks.repository';
import { emitToAll } from '../src/realtime/realtime';
import { updateStatus, updateComment, removeComment } from '../src/modules/tasks/tasks.service';
import { ForbiddenError, NotFoundError } from '../src/common/errors';

type Mock = ReturnType<typeof vi.fn>;
const findById = repo.findById as unknown as Mock;
const updateStatusRepo = repo.updateStatus as unknown as Mock;
const resolveEmployee = repo.findEmployeeIdByUserId as unknown as Mock;
const findCommentAuthor = repo.findCommentAuthor as unknown as Mock;
const updateCommentRepo = repo.updateComment as unknown as Mock;
const removeCommentRepo = repo.removeComment as unknown as Mock;
const broadcast = emitToAll as unknown as Mock;

function taskRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'T1',
    project_id: 'P1',
    parent_task_id: null,
    title: 'Task',
    description: null,
    status: 'todo',
    priority: 'medium',
    due_date: null,
    estimated_hours: null,
    a_id: null,
    a_code: null,
    a_first: null,
    a_last: null,
    a_title: null,
    a_avatar: null,
    r_id: null,
    r_code: null,
    r_first: null,
    r_last: null,
    r_title: null,
    r_avatar: null,
    comment_count: 0,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

describe('tasks.service — updateStatus authorization', () => {
  beforeEach(() => vi.clearAllMocks());

  it('404s when the task does not exist', async () => {
    findById.mockResolvedValue(null);
    await expect(updateStatus('T1', 'done', 'user', 'employee')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('lets an admin change any task without an ownership check', async () => {
    findById.mockResolvedValue(taskRow({ a_id: 'someone', r_id: 'else' }));
    updateStatusRepo.mockResolvedValue(taskRow({ status: 'done' }));

    const dto = await updateStatus('T1', 'done', 'admin-user', 'admin');

    expect(resolveEmployee).not.toHaveBeenCalled(); // no ownership lookup for privileged roles
    expect(updateStatusRepo).toHaveBeenCalledWith('T1', 'done');
    expect(broadcast).toHaveBeenCalledWith({ type: 'task_updated', taskId: 'T1', status: 'done' });
    expect(dto.status).toBe('done');
  });

  it('lets the ASSIGNEE change their task', async () => {
    findById.mockResolvedValue(taskRow({ a_id: 'E1', r_id: 'other' }));
    resolveEmployee.mockResolvedValue('E1');
    updateStatusRepo.mockResolvedValue(taskRow({ status: 'in_progress' }));
    await expect(updateStatus('T1', 'in_progress', 'user', 'employee')).resolves.toBeTruthy();
  });

  it('lets the REPORTER change their task', async () => {
    findById.mockResolvedValue(taskRow({ a_id: 'other', r_id: 'E1' }));
    resolveEmployee.mockResolvedValue('E1');
    updateStatusRepo.mockResolvedValue(taskRow({ status: 'in_review' }));
    await expect(updateStatus('T1', 'in_review', 'user', 'employee')).resolves.toBeTruthy();
  });

  it('403s for an employee who is neither assignee nor reporter', async () => {
    findById.mockResolvedValue(taskRow({ a_id: 'EX', r_id: 'EY' }));
    resolveEmployee.mockResolvedValue('E1');
    await expect(updateStatus('T1', 'done', 'user', 'employee')).rejects.toBeInstanceOf(ForbiddenError);
    expect(updateStatusRepo).not.toHaveBeenCalled();
  });

  it('403s for a user with no employee profile', async () => {
    findById.mockResolvedValue(taskRow({ a_id: 'EX', r_id: 'EY' }));
    resolveEmployee.mockResolvedValue(null);
    await expect(updateStatus('T1', 'done', 'user', 'employee')).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe('tasks.service — comment ownership (update/remove)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('404s when the comment does not exist', async () => {
    findCommentAuthor.mockResolvedValue(undefined);
    await expect(updateComment('C1', 'user', false, 'edit')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('lets an admin edit any comment', async () => {
    findCommentAuthor.mockResolvedValue('E-author');
    updateCommentRepo.mockResolvedValue({
      id: 'C1',
      task_id: 'T1',
      body: 'edit',
      author_id: 'E-author',
      author_code: 'EMP-9',
      author_first: 'A',
      author_last: 'B',
      author_title: null,
      author_avatar: null,
      created_at: new Date(),
      updated_at: new Date(),
    });
    await expect(updateComment('C1', 'admin-user', true, 'edit')).resolves.toBeTruthy();
    expect(resolveEmployee).not.toHaveBeenCalled(); // admin skips the ownership lookup
  });

  it('403s when a non-admin edits someone else\'s comment', async () => {
    findCommentAuthor.mockResolvedValue('E-author');
    resolveEmployee.mockResolvedValue('E-other');
    await expect(updateComment('C1', 'user', false, 'edit')).rejects.toBeInstanceOf(ForbiddenError);
    expect(updateCommentRepo).not.toHaveBeenCalled();
  });

  it('403s when a non-admin removes someone else\'s comment', async () => {
    findCommentAuthor.mockResolvedValue('E-author');
    resolveEmployee.mockResolvedValue('E-other');
    await expect(removeComment('C1', 'user', false)).rejects.toBeInstanceOf(ForbiddenError);
    expect(removeCommentRepo).not.toHaveBeenCalled();
  });
});
