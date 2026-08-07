import type { DepartmentDTO, PaginatedResponse } from '@ems/shared';
import { ConflictError, NotFoundError, ValidationError } from '../../common/errors';
import { buildPaginationMeta } from '../../common/http/pagination';
import { PG_ERROR, mapConstraint } from '../../common/db/pgErrors';
import * as repo from './departments.repository';
import type { DepartmentRow, ListParams } from './departments.repository';
import type { CreateDepartmentInput, UpdateDepartmentInput } from './departments.validation';

/** Constraint → HTTP mapping shared by create and update (both hit the same unique/FK rules). */
function translateWriteError(err: unknown): never {
  return mapConstraint(err, {
    [PG_ERROR.UNIQUE_VIOLATION]: () => new ConflictError('A department with this name already exists'),
    [PG_ERROR.FOREIGN_KEY_VIOLATION]: () => new ValidationError('Referenced department head does not exist'),
  });
}

/**
 * Departments business logic. Maps rows → DTOs, enforces existence, and — importantly —
 * translates database CONSTRAINT violations into meaningful HTTP errors (a unique-name clash
 * becomes 409, deleting a department with employees becomes 409). The DB is the last line of
 * defense for integrity; the service turns its raw error codes into a clean API contract.
 */
function toDTO(row: DepartmentRow): DepartmentDTO {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    head: row.head_id
      ? {
          id: row.head_id,
          employeeCode: row.head_employee_code ?? '',
          firstName: row.head_first_name ?? '',
          lastName: row.head_last_name ?? '',
          jobTitle: row.head_job_title ?? undefined,
          avatarUrl: row.head_avatar_url ?? undefined,
        }
      : null,
    employeeCount: row.employee_count,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function list(params: ListParams): Promise<PaginatedResponse<DepartmentDTO>> {
  const { rows, total } = await repo.list(params);
  return {
    data: rows.map(toDTO),
    meta: { pagination: buildPaginationMeta(params.page, params.limit, total) },
  };
}

export async function getById(id: string): Promise<DepartmentDTO> {
  const row = await repo.findById(id);
  if (!row) {
    throw new NotFoundError('Department not found');
  }
  return toDTO(row);
}

export async function create(input: CreateDepartmentInput): Promise<DepartmentDTO> {
  try {
    const row = await repo.create(input);
    return toDTO(row);
  } catch (err) {
    return translateWriteError(err);
  }
}

export async function update(id: string, input: UpdateDepartmentInput): Promise<DepartmentDTO> {
  let row: DepartmentRow | null;
  try {
    row = await repo.update(id, input);
  } catch (err) {
    return translateWriteError(err);
  }
  if (!row) {
    throw new NotFoundError('Department not found');
  }
  return toDTO(row);
}

export async function remove(id: string): Promise<void> {
  let deleted: boolean;
  try {
    deleted = await repo.remove(id);
  } catch (err) {
    mapConstraint(err, {
      [PG_ERROR.FOREIGN_KEY_VIOLATION]: () => new ConflictError('Cannot delete a department that still has employees'),
    });
  }
  if (!deleted) {
    throw new NotFoundError('Department not found');
  }
}
