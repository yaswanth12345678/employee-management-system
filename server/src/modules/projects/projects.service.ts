import type { PaginatedResponse, ProjectDTO, ProjectMemberDTO } from '@ems/shared';
import { ConflictError, NotFoundError, ValidationError } from '../../common/errors';
import { buildPaginationMeta } from '../../common/http/pagination';
import { PG_ERROR, mapConstraint } from '../../common/db/pgErrors';
import * as repo from './projects.repository';
import type { MemberRow, ProjectRow, ListParams } from './projects.repository';
import type { CreateProjectInput, UpdateProjectInput } from './projects.validation';

function toDTO(row: ProjectRow): ProjectDTO {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description ?? undefined,
    status: row.status,
    priority: row.priority,
    department: row.department_id ? { id: row.department_id, name: row.department_name ?? '' } : null,
    projectManager: row.pm_id
      ? {
          id: row.pm_id,
          employeeCode: row.pm_code ?? '',
          firstName: row.pm_first_name ?? '',
          lastName: row.pm_last_name ?? '',
          jobTitle: row.pm_job_title ?? undefined,
          avatarUrl: row.pm_avatar_url ?? undefined,
        }
      : null,
    startDate: row.start_date ?? undefined,
    endDate: row.end_date ?? undefined,
    budget: row.budget ?? undefined,
    memberCount: row.member_count,
    taskCount: row.task_count,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function memberToDTO(row: MemberRow): ProjectMemberDTO {
  return {
    employee: {
      id: row.employee_id,
      employeeCode: row.employee_code,
      firstName: row.first_name,
      lastName: row.last_name,
      jobTitle: row.job_title ?? undefined,
      avatarUrl: row.avatar_url ?? undefined,
    },
    roleOnProject: row.role_on_project ?? undefined,
    allocatedAt: row.allocated_at.toISOString(),
  };
}

function translateWriteError(err: unknown): never {
  return mapConstraint(err, {
    [PG_ERROR.UNIQUE_VIOLATION]: () => new ConflictError('A project with this code already exists'),
    [PG_ERROR.FOREIGN_KEY_VIOLATION]: () => new ValidationError('Referenced department or project manager does not exist'),
    [PG_ERROR.CHECK_VIOLATION]: () => new ValidationError('End date must be on or after the start date'),
  });
}

export async function list(params: ListParams): Promise<PaginatedResponse<ProjectDTO>> {
  const { rows, total } = await repo.list(params);
  return {
    data: rows.map(toDTO),
    meta: { pagination: buildPaginationMeta(params.page, params.limit, total) },
  };
}

export async function getById(id: string): Promise<ProjectDTO> {
  const row = await repo.findById(id);
  if (!row) throw new NotFoundError('Project not found');
  return toDTO(row);
}

export async function create(input: CreateProjectInput): Promise<ProjectDTO> {
  try {
    const row = await repo.create(input);
    return toDTO(row);
  } catch (err) {
    return translateWriteError(err);
  }
}

export async function update(id: string, input: UpdateProjectInput): Promise<ProjectDTO> {
  let row: ProjectRow | null;
  try {
    row = await repo.update(id, input);
  } catch (err) {
    return translateWriteError(err);
  }
  if (!row) throw new NotFoundError('Project not found');
  return toDTO(row);
}

export async function remove(id: string): Promise<void> {
  const deleted = await repo.remove(id);
  if (!deleted) throw new NotFoundError('Project not found');
}

export async function listMembers(projectId: string): Promise<ProjectMemberDTO[]> {
  if (!(await repo.projectExists(projectId))) throw new NotFoundError('Project not found');
  const rows = await repo.listMembers(projectId);
  return rows.map(memberToDTO);
}

export async function addMember(
  projectId: string,
  employeeId: string,
  roleOnProject?: string,
): Promise<void> {
  if (!(await repo.projectExists(projectId))) throw new NotFoundError('Project not found');
  try {
    await repo.addMember(projectId, employeeId, roleOnProject ?? null);
  } catch (err) {
    mapConstraint(err, {
      [PG_ERROR.UNIQUE_VIOLATION]: () => new ConflictError('This employee is already a member of the project'),
      [PG_ERROR.FOREIGN_KEY_VIOLATION]: () => new ValidationError('Employee does not exist'),
    });
  }
}

export async function removeMember(projectId: string, employeeId: string): Promise<void> {
  const removed = await repo.removeMember(projectId, employeeId);
  if (!removed) throw new NotFoundError('Project member not found');
}
