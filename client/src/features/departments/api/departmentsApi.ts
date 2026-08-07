import type {
  ApiResponse,
  CreateDepartmentRequest,
  DepartmentDTO,
  PaginatedResponse,
  UpdateDepartmentRequest,
} from '@ems/shared';
import { httpClient } from '../../../lib/http';

interface ListParams {
  page: number;
  limit: number;
  search?: string;
  sort?: string;
}

/** Data layer for the departments feature — typed wrappers over the shared http client. */
export async function list(params: ListParams): Promise<PaginatedResponse<DepartmentDTO>> {
  const { data } = await httpClient.get<PaginatedResponse<DepartmentDTO>>('/departments', {
    params,
  });
  return data;
}

export async function create(payload: CreateDepartmentRequest): Promise<DepartmentDTO> {
  const { data } = await httpClient.post<ApiResponse<DepartmentDTO>>('/departments', payload);
  return data.data;
}

export async function update(
  id: string,
  payload: UpdateDepartmentRequest,
): Promise<DepartmentDTO> {
  const { data } = await httpClient.patch<ApiResponse<DepartmentDTO>>(`/departments/${id}`, payload);
  return data.data;
}

export async function remove(id: string): Promise<void> {
  await httpClient.delete(`/departments/${id}`);
}
