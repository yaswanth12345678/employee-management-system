import type {
  ApiResponse,
  CommentDTO,
  CreateCommentRequest,
  CreateTaskRequest,
  PaginatedResponse,
  PriorityLevel,
  TaskDTO,
  TaskStatus,
  UpdateTaskRequest,
} from '@ems/shared';
import { httpClient } from '../../../lib/http';

interface ListParams {
  page: number;
  limit: number;
  search?: string;
  projectId?: string;
  assigneeId?: string;
  status?: TaskStatus;
  priority?: PriorityLevel;
  sort?: string;
}

export async function list(params: ListParams): Promise<PaginatedResponse<TaskDTO>> {
  const { data } = await httpClient.get<PaginatedResponse<TaskDTO>>('/tasks', { params });
  return data;
}

export async function create(payload: CreateTaskRequest): Promise<TaskDTO> {
  const { data } = await httpClient.post<ApiResponse<TaskDTO>>('/tasks', payload);
  return data.data;
}

export async function update(id: string, payload: UpdateTaskRequest): Promise<TaskDTO> {
  const { data } = await httpClient.patch<ApiResponse<TaskDTO>>(`/tasks/${id}`, payload);
  return data.data;
}

export async function updateStatus(id: string, status: TaskStatus): Promise<TaskDTO> {
  const { data } = await httpClient.patch<ApiResponse<TaskDTO>>(`/tasks/${id}/status`, { status });
  return data.data;
}

export async function remove(id: string): Promise<void> {
  await httpClient.delete(`/tasks/${id}`);
}

export async function listComments(taskId: string): Promise<CommentDTO[]> {
  const { data } = await httpClient.get<ApiResponse<CommentDTO[]>>(`/tasks/${taskId}/comments`);
  return data.data;
}

export async function addComment(taskId: string, payload: CreateCommentRequest): Promise<CommentDTO> {
  const { data } = await httpClient.post<ApiResponse<CommentDTO>>(`/tasks/${taskId}/comments`, payload);
  return data.data;
}
