import type { EmployeeDTO, PaginatedResponse, RoleName } from '@ems/shared';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../../common/errors';
import { buildPaginationMeta } from '../../common/http/pagination';
import { PG_ERROR, mapConstraint } from '../../common/db/pgErrors';
import { hashPassword } from '../../libs/password';
import * as repo from './employees.repository';
import type { EmployeeRow, ListParams } from './employees.repository';
import type { CreateEmployeeInput, UpdateEmployeeInput } from './employees.validation';

/**
 * Employees business logic. Owns the transactional user+employee creation, DTO mapping, and
 * translation of the various DB constraint violations this richer module can hit.
 */
function toDTO(row: EmployeeRow): EmployeeDTO {
  return {
    id: row.id,
    employeeCode: row.employee_code,
    firstName: row.first_name,
    lastName: row.last_name,
    jobTitle: row.job_title ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
    email: row.email,
    role: row.role_name,
    status: row.status,
    phone: row.phone ?? undefined,
    hireDate: row.hire_date,
    dateOfBirth: row.date_of_birth ?? undefined,
    isActive: row.is_active,
    department: row.department_id
      ? { id: row.department_id, name: row.department_name ?? '' }
      : null,
    manager: row.manager_emp_id
      ? {
          id: row.manager_emp_id,
          employeeCode: row.manager_code ?? '',
          firstName: row.manager_first_name ?? '',
          lastName: row.manager_last_name ?? '',
          jobTitle: row.manager_job_title ?? undefined,
          avatarUrl: row.manager_avatar_url ?? undefined,
        }
      : null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

/** Translate a DB constraint violation into the right HTTP error. Always throws. */
function translateWriteError(err: unknown): never {
  return mapConstraint(err, {
    [PG_ERROR.UNIQUE_VIOLATION]: () => new ConflictError('A user with this email already exists'),
    [PG_ERROR.FOREIGN_KEY_VIOLATION]: () => new ValidationError('Referenced department or manager does not exist'),
    [PG_ERROR.CHECK_VIOLATION]: () => new ValidationError('An employee cannot be their own manager'),
  });
}

export async function list(params: ListParams): Promise<PaginatedResponse<EmployeeDTO>> {
  const { rows, total } = await repo.list(params);
  return {
    data: rows.map(toDTO),
    meta: { pagination: buildPaginationMeta(params.page, params.limit, total) },
  };
}

export async function getById(id: string): Promise<EmployeeDTO> {
  const row = await repo.findById(id);
  if (!row) {
    throw new NotFoundError('Employee not found');
  }
  return toDTO(row);
}

export async function create(input: CreateEmployeeInput, creatorRole: RoleName): Promise<EmployeeDTO> {
  // Privilege-escalation guard: only an admin may grant the admin or hr roles.
  // (Otherwise an hr user could create an admin account and take over.)
  if (creatorRole !== 'admin' && (input.roleName === 'admin' || input.roleName === 'hr')) {
    throw new ForbiddenError('Only an admin can create admin or HR accounts');
  }
  const passwordHash = await hashPassword(input.password);
  try {
    const employeeId = await repo.createWithUser({
      email: input.email,
      passwordHash,
      roleName: input.roleName,
      firstName: input.firstName,
      lastName: input.lastName,
      jobTitle: input.jobTitle ?? null,
      departmentId: input.departmentId ?? null,
      managerId: input.managerId ?? null,
      hireDate: input.hireDate,
      phone: input.phone ?? null,
      dateOfBirth: input.dateOfBirth ?? null,
    });
    return await getById(employeeId);
  } catch (err) {
    return translateWriteError(err);
  }
}

export async function update(id: string, input: UpdateEmployeeInput): Promise<EmployeeDTO> {
  let row: EmployeeRow | null;
  try {
    row = await repo.update(id, input);
  } catch (err) {
    return translateWriteError(err);
  }
  if (!row) {
    throw new NotFoundError('Employee not found');
  }
  return toDTO(row);
}

export async function remove(id: string): Promise<void> {
  let deleted: boolean;
  try {
    deleted = await repo.remove(id);
  } catch (err) {
    mapConstraint(err, {
      [PG_ERROR.FOREIGN_KEY_VIOLATION]: () => new ConflictError('Cannot delete an employee who manages a project or has protected records'),
    });
  }
  if (!deleted) {
    throw new NotFoundError('Employee not found');
  }
}
