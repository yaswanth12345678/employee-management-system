import type { PriorityLevel, ProjectStatus } from '../enums';
import type { DepartmentSummary, EmployeeSummary } from './domain';

export interface ProjectDTO {
  id: string;
  code: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  priority: PriorityLevel;
  department: DepartmentSummary | null;
  projectManager: EmployeeSummary | null;
  startDate?: string;
  endDate?: string;
  budget?: number;
  memberCount: number;
  taskCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMemberDTO {
  employee: EmployeeSummary;
  roleOnProject?: string;
  allocatedAt: string;
}

export interface CreateProjectRequest {
  code: string;
  name: string;
  description?: string;
  departmentId?: string | null;
  projectManagerId?: string | null;
  status?: ProjectStatus;
  priority?: PriorityLevel;
  startDate?: string | null;
  endDate?: string | null;
  budget?: number | null;
}

export type UpdateProjectRequest = Partial<CreateProjectRequest>;

export interface AddProjectMemberRequest {
  employeeId: string;
  roleOnProject?: string;
}
