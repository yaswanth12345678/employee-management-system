import type {
  AddProjectMemberRequest,
  ApiResponse,
  CreateProjectRequest,
  PaginatedResponse,
  PriorityLevel,
  ProjectDTO,
  ProjectMemberDTO,
  ProjectStatus,
  UpdateProjectRequest,
} from '@ems/shared';
import { httpClient } from '../../../lib/http';

interface ListParams {
  page: number;
  limit: number;
  search?: string;
  status?: ProjectStatus;
  priority?: PriorityLevel;
  departmentId?: string;
  sort?: string;
}

export async function list(params: ListParams): Promise<PaginatedResponse<ProjectDTO>> {
  const { data } = await httpClient.get<PaginatedResponse<ProjectDTO>>('/projects', { params });
  return data;
}

export async function create(payload: CreateProjectRequest): Promise<ProjectDTO> {
  const { data } = await httpClient.post<ApiResponse<ProjectDTO>>('/projects', payload);
  return data.data;
}

export async function update(id: string, payload: UpdateProjectRequest): Promise<ProjectDTO> {
  const { data } = await httpClient.patch<ApiResponse<ProjectDTO>>(`/projects/${id}`, payload);
  return data.data;
}

export async function remove(id: string): Promise<void> {
  await httpClient.delete(`/projects/${id}`);
}

export async function listMembers(projectId: string): Promise<ProjectMemberDTO[]> {
  const { data } = await httpClient.get<ApiResponse<ProjectMemberDTO[]>>(
    `/projects/${projectId}/members`,
  );
  return data.data;
}

export async function addMember(projectId: string, payload: AddProjectMemberRequest): Promise<void> {
  await httpClient.post(`/projects/${projectId}/members`, payload);
}

export async function removeMember(projectId: string, employeeId: string): Promise<void> {
  await httpClient.delete(`/projects/${projectId}/members/${employeeId}`);
}
