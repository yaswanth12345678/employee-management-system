import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/modules/notifications/notifications.repository', () => ({
  list: vi.fn(),
  unreadCount: vi.fn(),
  markRead: vi.fn().mockResolvedValue(undefined),
  markAllRead: vi.fn().mockResolvedValue(undefined),
  remove: vi.fn(),
  create: vi.fn(),
  findUserIdByEmployeeId: vi.fn(),
}));
vi.mock('../src/realtime/realtime', () => ({ emitToUser: vi.fn() }));

import * as repo from '../src/modules/notifications/notifications.repository';
import { emitToUser } from '../src/realtime/realtime';
import { list, remove, notifyUser, notifyEmployee } from '../src/modules/notifications/notifications.service';
import { NotFoundError } from '../src/common/errors';

type Mock = ReturnType<typeof vi.fn>;
const listRepo = repo.list as unknown as Mock;
const removeRepo = repo.remove as unknown as Mock;
const createRepo = repo.create as unknown as Mock;
const findUserIdByEmployeeId = repo.findUserIdByEmployeeId as unknown as Mock;
const emit = emitToUser as unknown as Mock;

function notificationRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'N1',
    type: 'leave_status',
    title: 'Leave approved',
    message: 'Your leave was approved.',
    is_read: false,
    entity_type: 'leave_request',
    entity_id: 'L1',
    created_at: new Date(),
    read_at: null,
    ...overrides,
  };
}

describe('notifications.service — list paging', () => {
  beforeEach(() => vi.clearAllMocks());

  it('translates page/limit into the correct offset and passes the unreadOnly flag', async () => {
    listRepo.mockResolvedValue({ rows: [], total: 0 });
    await list('user-1', 3, 20, true);
    expect(listRepo).toHaveBeenCalledWith('user-1', 20, 40, true); // offset = (3-1)*20
  });
});

describe('notifications.service — remove is per-user scoped', () => {
  beforeEach(() => vi.clearAllMocks());

  it('404s when the notification is not the user\'s (repo.remove returns false)', async () => {
    removeRepo.mockResolvedValue(false);
    await expect(remove('N1', 'user-1')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('removes the user\'s own notification', async () => {
    removeRepo.mockResolvedValue(true);
    await expect(remove('N1', 'user-1')).resolves.toBeUndefined();
    expect(removeRepo).toHaveBeenCalledWith('N1', 'user-1');
  });
});

describe('notifications.service — emitting', () => {
  beforeEach(() => vi.clearAllMocks());

  it('notifyUser creates the row and pushes it live to that user only', async () => {
    createRepo.mockResolvedValue(notificationRow());
    await notifyUser('user-7', { type: 'leave_status', title: 't', message: 'm' });

    expect(createRepo).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-7', title: 't' }));
    expect(emit).toHaveBeenCalledWith('user-7', expect.objectContaining({ type: 'notification' }));
  });

  it('notifyEmployee is a no-op when the employee has no user account', async () => {
    findUserIdByEmployeeId.mockResolvedValue(null);
    await notifyEmployee('E-orphan', { type: 'leave_status', title: 't', message: 'm' });
    expect(createRepo).not.toHaveBeenCalled();
    expect(emit).not.toHaveBeenCalled();
  });

  it('notifyEmployee resolves the user then notifies them', async () => {
    findUserIdByEmployeeId.mockResolvedValue('user-7');
    createRepo.mockResolvedValue(notificationRow());
    await notifyEmployee('E1', { type: 'leave_status', title: 't', message: 'm' });
    expect(emit).toHaveBeenCalledWith('user-7', expect.objectContaining({ type: 'notification' }));
  });
});
