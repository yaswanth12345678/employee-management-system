import type {
  ApiResponse,
  AttendanceDTO,
  CheckInRequest,
  PaginatedResponse,
} from '@ems/shared';
import { httpClient } from '../../../lib/http';

interface ListParams {
  page: number;
  limit: number;
  employeeId?: string;
  from?: string;
  to?: string;
}

export async function checkIn(payload: CheckInRequest = {}): Promise<AttendanceDTO> {
  const { data } = await httpClient.post<ApiResponse<AttendanceDTO>>('/attendance/check-in', payload);
  return data.data;
}

export async function checkOut(): Promise<AttendanceDTO> {
  const { data } = await httpClient.post<ApiResponse<AttendanceDTO>>('/attendance/check-out');
  return data.data;
}

export async function today(): Promise<AttendanceDTO | null> {
  const { data } = await httpClient.get<ApiResponse<AttendanceDTO | null>>('/attendance/today');
  return data.data;
}

export async function listMine(params: ListParams): Promise<PaginatedResponse<AttendanceDTO>> {
  const { data } = await httpClient.get<PaginatedResponse<AttendanceDTO>>('/attendance/me', { params });
  return data;
}

export async function listAll(params: ListParams): Promise<PaginatedResponse<AttendanceDTO>> {
  const { data } = await httpClient.get<PaginatedResponse<AttendanceDTO>>('/attendance', { params });
  return data;
}
