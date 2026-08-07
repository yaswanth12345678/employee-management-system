import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/modules/attendance/attendance.repository', () => ({
  checkIn: vi.fn(),
  checkOut: vi.fn(),
  todayRecord: vi.fn(),
  list: vi.fn(),
}));
vi.mock('../src/common/db/employees', () => ({ findEmployeeIdByUserId: vi.fn() }));

import * as repo from '../src/modules/attendance/attendance.repository';
import { findEmployeeIdByUserId } from '../src/common/db/employees';
import { checkIn, checkOut, today } from '../src/modules/attendance/attendance.service';
import { PG_ERROR } from '../src/common/db/pgErrors';
import { ConflictError, ValidationError } from '../src/common/errors';

type Mock = ReturnType<typeof vi.fn>;
const checkInRepo = repo.checkIn as unknown as Mock;
const checkOutRepo = repo.checkOut as unknown as Mock;
const todayRepo = repo.todayRecord as unknown as Mock;
const resolveEmployee = findEmployeeIdByUserId as unknown as Mock;

function attendanceRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'A1',
    employee_id: 'E1',
    work_date: '2026-08-01',
    check_in_at: new Date(),
    check_out_at: null,
    status: 'present',
    notes: null,
    emp_code: 'EMP-1',
    emp_first: 'Ann',
    emp_last: 'Emp',
    emp_title: null,
    emp_avatar: null,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

describe('attendance.service — check-in state machine', () => {
  beforeEach(() => vi.clearAllMocks());

  it('requires an employee profile', async () => {
    resolveEmployee.mockResolvedValue(null);
    await expect(checkIn('user-1', {})).rejects.toBeInstanceOf(ValidationError);
    expect(checkInRepo).not.toHaveBeenCalled();
  });

  it('409s on a second check-in the same day (unique violation)', async () => {
    resolveEmployee.mockResolvedValue('E1');
    checkInRepo.mockRejectedValue({ code: PG_ERROR.UNIQUE_VIOLATION });
    await expect(checkIn('user-1', {})).rejects.toBeInstanceOf(ConflictError);
  });

  it('checks in successfully', async () => {
    resolveEmployee.mockResolvedValue('E1');
    checkInRepo.mockResolvedValue(attendanceRow());
    const dto = await checkIn('user-1', {});
    expect(checkInRepo).toHaveBeenCalledWith('E1', null, null);
    expect(dto.employeeId).toBe('E1');
  });
});

describe('attendance.service — check-out state machine', () => {
  beforeEach(() => vi.clearAllMocks());

  it('409s when there is no open check-in for today', async () => {
    resolveEmployee.mockResolvedValue('E1');
    checkOutRepo.mockResolvedValue(null);
    await expect(checkOut('user-1')).rejects.toBeInstanceOf(ConflictError);
  });

  it('checks out an open record', async () => {
    resolveEmployee.mockResolvedValue('E1');
    checkOutRepo.mockResolvedValue(attendanceRow({ check_out_at: new Date() }));
    const dto = await checkOut('user-1');
    expect(dto.checkOutAt).toBeTruthy();
  });
});

describe('attendance.service — today', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns null when there is no record for today', async () => {
    resolveEmployee.mockResolvedValue('E1');
    todayRepo.mockResolvedValue(null);
    expect(await today('user-1')).toBeNull();
  });

  it('returns the DTO when a record exists', async () => {
    resolveEmployee.mockResolvedValue('E1');
    todayRepo.mockResolvedValue(attendanceRow());
    const dto = await today('user-1');
    expect(dto?.id).toBe('A1');
  });
});
