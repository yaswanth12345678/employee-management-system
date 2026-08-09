import { useCallback, useEffect, useState } from 'react';
import type { DashboardSummaryDTO } from '@ems/shared';
import type { NormalizedError } from '../../../lib/http';
import * as dashboardApi from '../api/dashboardApi';

export function useDashboard() {
  const [summary, setSummary] = useState<DashboardSummaryDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSummary(await dashboardApi.summary());
    } catch (err) {
      setError((err as NormalizedError).message);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { summary, error, loading, refetch };
}
