import type {
  ApiResponse,
  CreateEmployeeRequest,
  EmployeeDTO,
  EmploymentStatus,
  PaginatedResponse,
  UpdateEmployeeRequest,
} from '@ems/shared';
import { httpClient } from '../../../lib/http';

interface ListParams {
  page: number;
  limit: number;
  search?: string;
  departmentId?: string;
  status?: EmploymentStatus;
  sort?: string;
}

/** Data layer for the employees feature. */
export async function list(params: ListParams): Promise<PaginatedResponse<EmployeeDTO>> {
  const { data } = await httpClient.get<PaginatedResponse<EmployeeDTO>>('/employees', { params });
  return data;
}

export async function getById(id: string): Promise<EmployeeDTO> {
  const { data } = await httpClient.get<ApiResponse<EmployeeDTO>>(`/employees/${id}`);
  return data.data;
}

export async function create(payload: CreateEmployeeRequest): Promise<EmployeeDTO> {
  const { data } = await httpClient.post<ApiResponse<EmployeeDTO>>('/employees', payload);
  return data.data;
}

export async function update(id: string, payload: UpdateEmployeeRequest): Promise<EmployeeDTO> {
  const { data } = await httpClient.patch<ApiResponse<EmployeeDTO>>(`/employees/${id}`, payload);
  return data.data;
}

export async function remove(id: string): Promise<void> {
  await httpClient.delete(`/employees/${id}`);
}
