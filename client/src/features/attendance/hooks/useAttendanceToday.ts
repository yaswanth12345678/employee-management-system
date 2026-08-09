import { useCallback, useEffect, useState } from 'react';
import type { AttendanceDTO } from '@ems/shared';
import * as attendanceApi from '../api/attendanceApi';

export function useAttendanceToday() {
  const [todayRecord, setTodayRecord] = useState<AttendanceDTO | null>(null);
  const [busy, setBusy] = useState(false);

  const refetch = useCallback(async () => {
    try {
      setTodayRecord(await attendanceApi.today());
    } catch {
      setTodayRecord(null);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const checkIn = useCallback(async () => {
    setBusy(true);
    try {
      await attendanceApi.checkIn();
      await refetch();
    } finally {
      setBusy(false);
    }
  }, [refetch]);

  const checkOut = useCallback(async () => {
    setBusy(true);
    try {
      await attendanceApi.checkOut();
      await refetch();
    } finally {
      setBusy(false);
    }
  }, [refetch]);

  return { todayRecord, busy, refetch, checkIn, checkOut };
}
