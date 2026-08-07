import type { LeaveStatus, LeaveType } from '../enums';
import type { EmployeeSummary } from './domain';

export interface LeaveRequestDTO {
  id: string;
  type: LeaveType;
  status: LeaveStatus;
  startDate: string;
  endDate: string;
  reason?: string;
  employee: EmployeeSummary;
  approver: EmployeeSummary | null;
  decidedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeaveRequest {
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason?: string;
}
