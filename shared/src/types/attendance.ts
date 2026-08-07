import type { AttendanceStatus } from '../enums';
import type { EmployeeSummary } from './domain';

export interface AttendanceDTO {
  id: string;
  employeeId: string;
  workDate: string;
  checkInAt?: string;
  checkOutAt?: string;
  status: AttendanceStatus;
  notes?: string;
  employee: EmployeeSummary;
  createdAt: string;
  updatedAt: string;
}

export interface CheckInRequest {
  status?: AttendanceStatus;
  notes?: string;
}
