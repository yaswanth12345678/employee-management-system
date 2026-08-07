import type { AttendanceStatus } from '../enums';
import type { NotificationDTO } from './notification';

export interface DashboardSummaryDTO {
  myOpenTasks: number;
  myPendingLeave: number;
  todayAttendanceStatus: AttendanceStatus | null;
  teamStats?: {
    headcount: number;
    onLeaveToday: number;
  };
  projectStats?: {
    active: number;
    overdue: number;
  };
  recentNotifications: NotificationDTO[];
}
