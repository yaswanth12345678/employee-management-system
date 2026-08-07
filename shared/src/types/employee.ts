import type { EmploymentStatus, RoleName } from '../enums';
import type { DepartmentSummary, EmployeeSummary } from './domain';

/** Full employee representation returned by the API (never includes the password hash). */
export interface EmployeeDTO extends EmployeeSummary {
  email: string;
  role: RoleName;
  status: EmploymentStatus;
  phone?: string;
  hireDate: string; // YYYY-MM-DD
  dateOfBirth?: string;
  isActive: boolean;
  department: DepartmentSummary | null;
  manager: EmployeeSummary | null;
  createdAt: string;
  updatedAt: string;
}

/** Creating an employee also provisions their user account (in one transaction). */
export interface CreateEmployeeRequest {
  email: string;
  password: string;
  roleName: RoleName;
  firstName: string;
  lastName: string;
  jobTitle?: string;
  departmentId?: string | null;
  managerId?: string | null;
  hireDate: string; // YYYY-MM-DD
  phone?: string;
  dateOfBirth?: string;
}

export interface UpdateEmployeeRequest {
  firstName?: string;
  lastName?: string;
  jobTitle?: string | null;
  departmentId?: string | null;
  managerId?: string | null;
  status?: EmploymentStatus;
  phone?: string | null;
  dateOfBirth?: string | null;
}
