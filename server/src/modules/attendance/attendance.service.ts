import type { AttendanceDTO, PaginatedResponse } from '@ems/shared';
import { ConflictError, ValidationError } from '../../common/errors';
import { buildPaginationMeta } from '../../common/http/pagination';
import { PG_ERROR, mapConstraint } from '../../common/db/pgErrors';
import { findEmployeeIdByUserId } from '../employees/employees.repository';
import * as repo from './attendance.repository';
import type { AttendanceRow, ListParams } from './attendance.repository';
import type { CheckInInput } from './attendance.validation';

function toDTO(row: AttendanceRow): AttendanceDTO {
  return {
    id: row.id,
    employeeId: row.employee_id,
    workDate: row.work_date,
    checkInAt: row.check_in_at ? row.check_in_at.toISOString() : undefined,
    checkOutAt: row.check_out_at ? row.check_out_at.toISOString() : undefined,
    status: row.status,
    notes: row.notes ?? undefined,
    employee: {
      id: row.employee_id,
      employeeCode: row.emp_code,
      firstName: row.emp_first,
      lastName: row.emp_last,
      jobTitle: row.emp_title ?? undefined,
      avatarUrl: row.emp_avatar ?? undefined,
    },
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

async function requireEmployeeId(userId: string): Promise<string> {
  const id = await findEmployeeIdByUserId(userId);
  if (!id) throw new ValidationError('Only users with an employee profile can record attendance');
  return id;
}

export async function checkIn(userId: string, input: CheckInInput): Promise<AttendanceDTO> {
  const employeeId = await requireEmployeeId(userId);
  try {
    return toDTO(await repo.checkIn(employeeId, input.status ?? null, input.notes ?? null));
  } catch (err) {
    mapConstraint(err, {
      [PG_ERROR.UNIQUE_VIOLATION]: () => new ConflictError('You have already checked in today'),
    });
  }
}

export async function checkOut(userId: string): Promise<AttendanceDTO> {
  const employeeId = await requireEmployeeId(userId);
  const row = await repo.checkOut(employeeId);
  if (!row) throw new ConflictError('No open check-in found for today');
  return toDTO(row);
}

export async function today(userId: string): Promise<AttendanceDTO | null> {
  const employeeId = await requireEmployeeId(userId);
  const row = await repo.todayRecord(employeeId);
  return row ? toDTO(row) : null;
}

export async function listMine(userId: string, params: Omit<ListParams, 'employeeId'>): Promise<PaginatedResponse<AttendanceDTO>> {
  const employeeId = await requireEmployeeId(userId);
  return listAll({ ...params, employeeId });
}

export async function listAll(params: ListParams): Promise<PaginatedResponse<AttendanceDTO>> {
  const { rows, total } = await repo.list(params);
  return { data: rows.map(toDTO), meta: { pagination: buildPaginationMeta(params.page, params.limit, total) } };
}
