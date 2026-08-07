import { useCallback, useEffect, useState } from 'react';
import { Box, Paper, Stack, Typography } from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import type { AttendanceDTO } from '@ems/shared';
import type { NormalizedError } from '../../../lib/http';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Button } from '../../../components/ui/Button';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { useAuth } from '../../../contexts/AuthContext';
import { useSnackbar } from '../../../contexts/SnackbarContext';
import { useAttendance } from '../hooks/useAttendance';
import { AttendanceStatusChip } from '../components/AttendanceStatusChip';
import * as attendanceApi from '../api/attendanceApi';

function formatTime(iso?: string): string {
  return iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
}

export function AttendancePage() {
  const { user } = useAuth();
  const { notify } = useSnackbar();
  const canViewAll = user?.role === 'admin' || user?.role === 'hr' || user?.role === 'manager';
  const records = useAttendance(canViewAll ? 'all' : 'mine');

  const [todayRecord, setTodayRecord] = useState<AttendanceDTO | null>(null);
  const [busy, setBusy] = useState(false);

  const loadToday = useCallback(async () => {
    try {
      setTodayRecord(await attendanceApi.today());
    } catch {
      setTodayRecord(null);
    }
  }, []);

  useEffect(() => {
    void loadToday();
  }, [loadToday]);

  const handleCheckIn = async () => {
    setBusy(true);
    try {
      await attendanceApi.checkIn();
      notify('Checked in', 'success');
      await Promise.all([loadToday(), records.refetch()]);
    } catch (err) {
      notify((err as NormalizedError).message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleCheckOut = async () => {
    setBusy(true);
    try {
      await attendanceApi.checkOut();
      notify('Checked out', 'success');
      await Promise.all([loadToday(), records.refetch()]);
    } catch (err) {
      notify((err as NormalizedError).message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const checkedIn = Boolean(todayRecord?.checkInAt);
  const checkedOut = Boolean(todayRecord?.checkOutAt);

  const columns: Column<AttendanceDTO>[] = [
    ...(canViewAll
      ? [{ key: 'employee', header: 'Employee', render: (r: AttendanceDTO) => `${r.employee.firstName} ${r.employee.lastName}` }]
      : []),
    { key: 'workDate', header: 'Date', render: (r) => r.workDate },
    { key: 'in', header: 'Check-in', render: (r) => formatTime(r.checkInAt) },
    { key: 'out', header: 'Check-out', render: (r) => formatTime(r.checkOutAt) },
    { key: 'status', header: 'Status', render: (r) => <AttendanceStatusChip status={r.status} /> },
  ];

  return (
    <>
      <PageHeader title="Attendance" subtitle="Track your working hours" />

      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems={{ sm: 'center' }} justifyContent="space-between">
          <Box>
            <Typography variant="overline" color="text.secondary">
              Today
            </Typography>
            <Typography variant="h6">
              {checkedIn
                ? checkedOut
                  ? `In ${formatTime(todayRecord?.checkInAt)} · Out ${formatTime(todayRecord?.checkOutAt)}`
                  : `Checked in at ${formatTime(todayRecord?.checkInAt)}`
                : 'Not checked in yet'}
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              startIcon={<LoginIcon />}
              onClick={handleCheckIn}
              loading={busy}
              disabled={checkedIn}
            >
              Check in
            </Button>
            <Button
              variant="outlined"
              startIcon={<LogoutIcon />}
              onClick={handleCheckOut}
              loading={busy}
              disabled={!checkedIn || checkedOut}
            >
              Check out
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
        {canViewAll ? 'All records' : 'My records'}
      </Typography>
      <DataTable
        columns={columns}
        rows={records.data}
        getRowId={(r) => r.id}
        loading={records.loading}
        error={records.error}
        onRetry={records.refetch}
        emptyTitle="No attendance records yet"
        page={records.page}
        limit={records.limit}
        total={records.total}
        onPageChange={records.setPage}
        onLimitChange={records.setLimit}
      />
    </>
  );
}
