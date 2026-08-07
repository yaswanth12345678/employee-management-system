import { useCallback } from 'react';
import type { AttendanceDTO } from '@ems/shared';
import { usePaginatedList } from '../../../hooks/usePaginatedList';
import * as attendanceApi from '../api/attendanceApi';

/** `scope` decides whether we load the current user's records or everyone's (admin/hr/manager). */
export function useAttendance(scope: 'mine' | 'all') {
  const fetchPage = useCallback(
    (page: number, limit: number) =>
      (scope === 'all'
        ? attendanceApi.listAll({ page, limit })
        : attendanceApi.listMine({ page, limit })
      ).then((res) => ({ data: res.data, total: res.meta.pagination.total })),
    [scope],
  );

  return usePaginatedList<AttendanceDTO>(fetchPage);
}
