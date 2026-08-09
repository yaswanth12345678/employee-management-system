import type { DashboardSummaryDTO, RoleName } from '@ems/shared';
import { findEmployeeIdByUserId } from '../employees/employees.repository';
import { notificationsService } from '../notifications';
import * as repo from './dashboard.repository';

const MANAGER_ROLES: RoleName[] = ['admin', 'hr', 'manager'];

export async function summary(userId: string, role: RoleName): Promise<DashboardSummaryDTO> {
  const employeeId = await findEmployeeIdByUserId(userId);

  // "My" stats require an employee profile; default to zero/empty if there isn't one.
  const [myOpenTasks, myPendingLeave, todayAttendanceStatus] = employeeId
    ? await Promise.all([
        repo.myOpenTasks(employeeId),
        repo.myPendingLeave(employeeId),
        repo.todayAttendanceStatus(employeeId),
      ])
    : [0, 0, null];

  const recent = await notificationsService.list(userId, 1, 5, false);

  const dto: DashboardSummaryDTO = {
    myOpenTasks,
    myPendingLeave,
    todayAttendanceStatus,
    recentNotifications: recent.data,
  };

  // Managers/HR/admin get org-wide widgets too.
  if (MANAGER_ROLES.includes(role)) {
    const [headcount, onLeaveToday, active, overdue] = await Promise.all([
      repo.headcount(),
      repo.onLeaveToday(),
      repo.activeProjects(),
      repo.overdueProjects(),
    ]);
    dto.teamStats = { headcount, onLeaveToday };
    dto.projectStats = { active, overdue };
  }

  return dto;
}
