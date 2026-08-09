import type { LeaveRequestDTO, PaginatedResponse, RoleName } from '@ems/shared';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../../common/errors';
import { buildPaginationMeta } from '../../common/http/pagination';
import { PG_ERROR, pgErrorCode } from '../../common/db/pgErrors';
import { findEmployeeIdByUserId } from '../employees/employees.repository';
import { notificationsService } from '../notifications';
import * as repo from './leave.repository';
import type { LeaveRow, ListParams } from './leave.repository';
import type { CreateLeaveInput } from './leave.validation';

const MANAGER_ROLES: RoleName[] = ['admin', 'hr', 'manager'];

function summary(
  id: string,
  code: string,
  first: string,
  last: string,
  jobTitle: string | null,
  avatar: string | null,
) {
  return {
    id,
    employeeCode: code,
    firstName: first,
    lastName: last,
    jobTitle: jobTitle ?? undefined,
    avatarUrl: avatar ?? undefined,
  };
}

function toDTO(row: LeaveRow): LeaveRequestDTO {
  return {
    id: row.id,
    type: row.type,
    status: row.status,
    startDate: row.start_date,
    endDate: row.end_date,
    reason: row.reason ?? undefined,
    employee: summary(row.emp_id, row.emp_code, row.emp_first, row.emp_last, row.emp_title, row.emp_avatar),
    approver: row.app_id
      ? summary(row.app_id, row.app_code ?? '', row.app_first ?? '', row.app_last ?? '', row.app_title, row.app_avatar)
      : null,
    decidedAt: row.decided_at ? row.decided_at.toISOString() : undefined,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

async function requireEmployeeId(userId: string): Promise<string> {
  const employeeId = await findEmployeeIdByUserId(userId);
  if (!employeeId) throw new ValidationError('Only users with an employee profile can use leave');
  return employeeId;
}

export async function list(
  userId: string,
  role: RoleName,
  filters: Omit<ListParams, 'employeeId'>,
): Promise<PaginatedResponse<LeaveRequestDTO>> {
  // Managers/HR/admin see everyone's requests; a plain employee sees only their own.
  const params: ListParams = { ...filters };
  if (!MANAGER_ROLES.includes(role)) {
    params.employeeId = await requireEmployeeId(userId);
  }
  const { rows, total } = await repo.list(params);
  return { data: rows.map(toDTO), meta: { pagination: buildPaginationMeta(params.page, params.limit, total) } };
}

export async function apply(userId: string, input: CreateLeaveInput): Promise<LeaveRequestDTO> {
  const employeeId = await requireEmployeeId(userId);
  try {
    return toDTO(await repo.create(employeeId, input));
  } catch (err) {
    if (pgErrorCode(err) === PG_ERROR.CHECK_VIOLATION) {
      throw new ValidationError('End date must be on or after the start date');
    }
    throw err;
  }
}

async function decideOrThrow(
  id: string,
  status: 'approved' | 'rejected',
  approverUserId: string,
): Promise<LeaveRequestDTO> {
  const meta = await repo.findMeta(id);
  if (!meta) throw new NotFoundError('Leave request not found');
  const approverId = await requireEmployeeId(approverUserId);
  // Segregation of duties: you cannot decide on your own request.
  if (approverId === meta.employeeId) {
    throw new ForbiddenError('You cannot approve or reject your own leave request');
  }
  const ok = await repo.decide(id, status, approverId);
  if (!ok) throw new ConflictError(`Only a pending request can be ${status}`);
  const row = (await repo.findById(id)) as LeaveRow;

  // Side effect: notify the requester of the decision.
  await notificationsService.notifyEmployee(meta.employeeId, {
    type: 'leave_status',
    title: `Leave ${status}`,
    message: `Your ${row.type} leave (${row.start_date} → ${row.end_date}) was ${status}.`,
    entityType: 'leave_request',
    entityId: id,
  });

  return toDTO(row);
}

export function approve(id: string, approverUserId: string): Promise<LeaveRequestDTO> {
  return decideOrThrow(id, 'approved', approverUserId);
}

export function reject(id: string, approverUserId: string): Promise<LeaveRequestDTO> {
  return decideOrThrow(id, 'rejected', approverUserId);
}

export async function cancel(id: string, userId: string): Promise<LeaveRequestDTO> {
  const meta = await repo.findMeta(id);
  if (!meta) throw new NotFoundError('Leave request not found');
  const employeeId = await requireEmployeeId(userId);
  if (meta.employeeId !== employeeId) {
    throw new ForbiddenError('You can only cancel your own leave request');
  }
  const ok = await repo.cancel(id, employeeId);
  if (!ok) throw new ConflictError('Only a pending request can be cancelled');
  const row = await repo.findById(id);
  return toDTO(row as LeaveRow);
}
