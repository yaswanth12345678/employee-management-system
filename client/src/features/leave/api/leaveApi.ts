import type {
  ApiResponse,
  CreateLeaveRequest,
  LeaveRequestDTO,
  LeaveStatus,
  LeaveType,
  PaginatedResponse,
} from '@ems/shared';
import { httpClient } from '../../../lib/http';

interface ListParams {
  page: number;
  limit: number;
  status?: LeaveStatus;
  type?: LeaveType;
}

export async function list(params: ListParams): Promise<PaginatedResponse<LeaveRequestDTO>> {
  const { data } = await httpClient.get<PaginatedResponse<LeaveRequestDTO>>('/leave-requests', {
    params,
  });
  return data;
}

export async function apply(payload: CreateLeaveRequest): Promise<LeaveRequestDTO> {
  const { data } = await httpClient.post<ApiResponse<LeaveRequestDTO>>('/leave-requests', payload);
  return data.data;
}

export async function approve(id: string): Promise<void> {
  await httpClient.patch(`/leave-requests/${id}/approve`);
}

export async function reject(id: string): Promise<void> {
  await httpClient.patch(`/leave-requests/${id}/reject`);
}

export async function cancel(id: string): Promise<void> {
  await httpClient.patch(`/leave-requests/${id}/cancel`);
}
