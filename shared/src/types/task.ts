import type { PriorityLevel, TaskStatus } from '../enums';
import type { EmployeeSummary } from './domain';

export interface TaskDTO {
  id: string;
  projectId: string;
  parentTaskId: string | null;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: PriorityLevel;
  dueDate?: string;
  estimatedHours?: number;
  assignee: EmployeeSummary | null;
  reporter: EmployeeSummary | null;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CommentDTO {
  id: string;
  taskId: string;
  body: string;
  author: EmployeeSummary | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  projectId: string;
  title: string;
  description?: string;
  assigneeId?: string | null;
  reporterId?: string | null;
  status?: TaskStatus;
  priority?: PriorityLevel;
  dueDate?: string | null;
  estimatedHours?: number | null;
  parentTaskId?: string | null;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  assigneeId?: string | null;
  reporterId?: string | null;
  status?: TaskStatus;
  priority?: PriorityLevel;
  dueDate?: string | null;
  estimatedHours?: number | null;
}

export interface UpdateTaskStatusRequest {
  status: TaskStatus;
}

export interface CreateCommentRequest {
  body: string;
}
