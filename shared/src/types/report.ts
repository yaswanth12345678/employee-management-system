export interface CountByKey {
  key: string;
  count: number;
}

export interface AttendanceSummaryDTO {
  byStatus: CountByKey[];
}

export interface LeaveSummaryDTO {
  byStatus: CountByKey[];
  byType: CountByKey[];
}

export interface ProjectStatusSummaryDTO {
  byStatus: CountByKey[];
}

export interface HeadcountSummaryDTO {
  total: number;
  byDepartment: CountByKey[];
  byStatus: CountByKey[];
}
