import type { EmployeeSummary } from './domain';

/** Full department representation returned by the API. */
export interface DepartmentDTO {
  id: string;
  name: string;
  description?: string;
  head: EmployeeSummary | null;
  employeeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentRequest {
  name: string;
  description?: string;
  headId?: string | null;
}

export interface UpdateDepartmentRequest {
  name?: string;
  description?: string;
  headId?: string | null;
}
