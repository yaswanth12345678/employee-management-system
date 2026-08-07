import type {
  AttendanceSummaryDTO,
  HeadcountSummaryDTO,
  LeaveSummaryDTO,
  ProjectStatusSummaryDTO,
} from '@ems/shared';
import * as repo from './reports.repository';

interface DateRange {
  from?: string;
  to?: string;
}

export async function attendanceSummary(range: DateRange): Promise<AttendanceSummaryDTO> {
  return { byStatus: await repo.attendanceByStatus(range) };
}

export async function leaveSummary(range: DateRange): Promise<LeaveSummaryDTO> {
  const [byStatus, byType] = await Promise.all([
    repo.leaveByStatus(range),
    repo.leaveByType(range),
  ]);
  return { byStatus, byType };
}

export async function projectStatusSummary(): Promise<ProjectStatusSummaryDTO> {
  return { byStatus: await repo.projectByStatus() };
}

export async function headcountSummary(): Promise<HeadcountSummaryDTO> {
  const [total, byDepartment, byStatus] = await Promise.all([
    repo.headcountTotal(),
    repo.headcountByDepartment(),
    repo.headcountByStatus(),
  ]);
  return { total, byDepartment, byStatus };
}
