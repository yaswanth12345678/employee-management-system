import type {
  ApiResponse,
  AttendanceSummaryDTO,
  HeadcountSummaryDTO,
  LeaveSummaryDTO,
  ProjectStatusSummaryDTO,
} from '@ems/shared';
import { httpClient } from '../../../lib/http';

export async function headcount(): Promise<HeadcountSummaryDTO> {
  const { data } = await httpClient.get<ApiResponse<HeadcountSummaryDTO>>('/reports/headcount');
  return data.data;
}

export async function projectStatus(): Promise<ProjectStatusSummaryDTO> {
  const { data } = await httpClient.get<ApiResponse<ProjectStatusSummaryDTO>>('/reports/project-status');
  return data.data;
}

export async function leaveSummary(): Promise<LeaveSummaryDTO> {
  const { data } = await httpClient.get<ApiResponse<LeaveSummaryDTO>>('/reports/leave-summary');
  return data.data;
}

export async function attendanceSummary(): Promise<AttendanceSummaryDTO> {
  const { data } = await httpClient.get<ApiResponse<AttendanceSummaryDTO>>('/reports/attendance-summary');
  return data.data;
}
