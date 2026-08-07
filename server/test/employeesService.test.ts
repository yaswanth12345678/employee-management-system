import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/modules/employees/employees.repository', () => ({
  createWithUser: vi.fn(),
  findById: vi.fn(),
}));
vi.mock('../src/libs/password', () => ({ hashPassword: vi.fn() }));

import * as repo from '../src/modules/employees/employees.repository';
import { hashPassword } from '../src/libs/password';
import { create } from '../src/modules/employees/employees.service';
import { ForbiddenError } from '../src/common/errors';
import type { CreateEmployeeInput } from '../src/modules/employees/employees.validation';

type Mock = ReturnType<typeof vi.fn>;
const createWithUser = repo.createWithUser as unknown as Mock;
const findById = repo.findById as unknown as Mock;
const hash = hashPassword as unknown as Mock;

function input(roleName: string): CreateEmployeeInput {
  return {
    email: 'new@ems.local',
    password: 'S3cret!!',
    roleName,
    firstName: 'New',
    lastName: 'Hire',
    hireDate: '2026-08-01',
  } as unknown as CreateEmployeeInput;
}

function employeeRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'E-new',
    employee_code: 'EMP-00099',
    first_name: 'New',
    last_name: 'Hire',
    phone: null,
    job_title: null,
    status: 'probation',
    hire_date: '2026-08-01',
    date_of_birth: null,
    avatar_url: null,
    department_id: null,
    manager_id: null,
    email: 'new@ems.local',
    is_active: true,
    role_name: 'employee',
    department_name: null,
    manager_emp_id: null,
    manager_code: null,
    manager_first_name: null,
    manager_last_name: null,
    manager_job_title: null,
    manager_avatar_url: null,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

describe('employees.service.create — privilege-escalation guard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('forbids a non-admin (hr) from creating an ADMIN account', async () => {
    await expect(create(input('admin'), 'hr')).rejects.toBeInstanceOf(ForbiddenError);
    expect(hash).not.toHaveBeenCalled();
    expect(createWithUser).not.toHaveBeenCalled();
  });

  it('forbids a non-admin (hr) from creating an HR account', async () => {
    await expect(create(input('hr'), 'hr')).rejects.toBeInstanceOf(ForbiddenError);
    expect(createWithUser).not.toHaveBeenCalled();
  });

  it('forbids a manager from creating an HR account', async () => {
    await expect(create(input('hr'), 'manager')).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('lets hr create a plain employee', async () => {
    hash.mockResolvedValue('hashed');
    createWithUser.mockResolvedValue('E-new');
    findById.mockResolvedValue(employeeRow());

    const dto = await create(input('employee'), 'hr');
    expect(createWithUser).toHaveBeenCalledOnce();
    expect(dto.id).toBe('E-new');
  });

  it('lets an admin create an admin (privileged path allowed)', async () => {
    hash.mockResolvedValue('hashed');
    createWithUser.mockResolvedValue('E-new');
    findById.mockResolvedValue(employeeRow({ role_name: 'admin' }));

    const dto = await create(input('admin'), 'admin');
    expect(createWithUser).toHaveBeenCalledOnce();
    expect(dto.role).toBe('admin');
  });
});
