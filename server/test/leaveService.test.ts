import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the data layer + side-effects so the service's business rules run in isolation.
vi.mock('../src/modules/leave/leave.repository', () => ({
  findMeta: vi.fn(),
  decide: vi.fn(),
  cancel: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  list: vi.fn(),
}));
vi.mock('../src/common/db/employees', () => ({ findEmployeeIdByUserId: vi.fn() }));
vi.mock('../src/modules/notifications', () => ({
  notificationsService: { notifyEmployee: vi.fn() },
}));

import * as repo from '../src/modules/leave/leave.repository';
import { findEmployeeIdByUserId } from '../src/common/db/employees';
import { notificationsService } from '../src/modules/notifications';
import { approve, cancel } from '../src/modules/leave/leave.service';
import { ConflictError, ForbiddenError, NotFoundError } from '../src/common/errors';

type Mock = ReturnType<typeof vi.fn>;
const findMeta = repo.findMeta as unknown as Mock;
const decide = repo.decide as unknown as Mock;
const cancelRepo = repo.cancel as unknown as Mock;
const findById = repo.findById as unknown as Mock;
const resolveEmployee = findEmployeeIdByUserId as unknown as Mock;
const notify = notificationsService.notifyEmployee as unknown as Mock;

function leaveRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'L1',
    type: 'annual',
    status: 'approved',
    start_date: '2026-08-01',
    end_date: '2026-08-03',
    reason: null,
    emp_id: 'E-owner',
    emp_code: 'EMP-1',
    emp_first: 'Ann',
    emp_last: 'Owner',
    emp_title: null,
    emp_avatar: null,
    app_id: 'E-approver',
    app_code: 'EMP-2',
    app_first: 'Bob',
    app_last: 'Boss',
    app_title: null,
    app_avatar: null,
    decided_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

describe('leave.service — approve (segregation of duties + state machine)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('404s when the request does not exist', async () => {
    findMeta.mockResolvedValue(null);
    await expect(approve('L1', 'approver-user')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('403s when the approver IS the requester (cannot self-approve)', async () => {
    findMeta.mockResolvedValue({ employeeId: 'E-self' });
    resolveEmployee.mockResolvedValue('E-self'); // approver resolves to the same employee
    await expect(approve('L1', 'self-user')).rejects.toBeInstanceOf(ForbiddenError);
    expect(decide).not.toHaveBeenCalled();
  });

  it('409s when the request is not pending (decide returns false)', async () => {
    findMeta.mockResolvedValue({ employeeId: 'E-owner' });
    resolveEmployee.mockResolvedValue('E-approver');
    decide.mockResolvedValue(false);
    await expect(approve('L1', 'approver-user')).rejects.toBeInstanceOf(ConflictError);
  });

  it('approves a pending request (different approver) and notifies the requester', async () => {
    findMeta.mockResolvedValue({ employeeId: 'E-owner' });
    resolveEmployee.mockResolvedValue('E-approver');
    decide.mockResolvedValue(true);
    findById.mockResolvedValue(leaveRow({ status: 'approved' }));

    const dto = await approve('L1', 'approver-user');

    expect(decide).toHaveBeenCalledWith('L1', 'approved', 'E-approver');
    expect(dto.status).toBe('approved');
    expect(notify).toHaveBeenCalledWith('E-owner', expect.objectContaining({ type: 'leave_status' }));
  });
});

describe('leave.service — cancel (owner-only + state machine)', () => {
  beforeEach(() => vi.clearAllMocks());

  it("403s when cancelling someone else's request", async () => {
    findMeta.mockResolvedValue({ employeeId: 'E-owner' });
    resolveEmployee.mockResolvedValue('E-other');
    await expect(cancel('L1', 'other-user')).rejects.toBeInstanceOf(ForbiddenError);
    expect(cancelRepo).not.toHaveBeenCalled();
  });

  it('409s when the request is not pending', async () => {
    findMeta.mockResolvedValue({ employeeId: 'E-owner' });
    resolveEmployee.mockResolvedValue('E-owner');
    cancelRepo.mockResolvedValue(false);
    await expect(cancel('L1', 'owner-user')).rejects.toBeInstanceOf(ConflictError);
  });

  it("cancels the owner's own pending request", async () => {
    findMeta.mockResolvedValue({ employeeId: 'E-owner' });
    resolveEmployee.mockResolvedValue('E-owner');
    cancelRepo.mockResolvedValue(true);
    findById.mockResolvedValue(leaveRow({ status: 'cancelled' }));

    const dto = await cancel('L1', 'owner-user');
    expect(cancelRepo).toHaveBeenCalledWith('L1', 'E-owner');
    expect(dto.status).toBe('cancelled');
  });
});
