import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  AttendanceSummaryDTO,
  HeadcountSummaryDTO,
  LeaveSummaryDTO,
  ProjectStatusSummaryDTO,
} from '@ems/shared';
import type { NormalizedError } from '../../../lib/http';
import * as reportsApi from '../api/reportsApi';

interface ReportsData {
  headcount: HeadcountSummaryDTO | null;
  projectStatus: ProjectStatusSummaryDTO | null;
  leave: LeaveSummaryDTO | null;
  attendance: AttendanceSummaryDTO | null;
  loading: boolean;
  error: string | null;
}

export function useReports() {
  const [state, setState] = useState<ReportsData>({
    headcount: null,
    projectStatus: null,
    leave: null,
    attendance: null,
    loading: true,
    error: null,
  });

  const fetchAll = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const [headcount, projectStatus, leave, attendance] = await Promise.all([
        reportsApi.headcount(),
        reportsApi.projectStatus(),
        reportsApi.leaveSummary(),
        reportsApi.attendanceSummary(),
      ]);
      setState({ headcount, projectStatus, leave, attendance, loading: false, error: null });
    } catch (err) {
      setState((prev) => ({ ...prev, loading: false, error: (err as NormalizedError).message }));
    }
  }, []);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  return useMemo(() => ({ ...state, refetch: fetchAll }), [state, fetchAll]);
}
