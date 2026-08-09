import { useState } from 'react';
import { Box, IconButton, MenuItem, Stack, TextField, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import CancelScheduleSendIcon from '@mui/icons-material/CancelScheduleSend';
import type { LeaveRequestDTO } from '@ems/shared';
import type { NormalizedError } from '../../../lib/http';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Button } from '../../../components/ui/Button';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { useAuth } from '../../../contexts/AuthContext';
import { useSnackbar } from '../../../contexts/SnackbarContext';
import { useDisclosure } from '../../../hooks/useDisclosure';
import { useLeave } from '../hooks/useLeave';
import { LeaveFormDialog } from '../components/LeaveFormDialog';
import { LeaveStatusChip } from '../components/LeaveStatusChip';
import type { LeaveFormValues } from '../validation';

const STATUS_FILTERS = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function LeavePage() {
  const { user } = useAuth();
  const { notify } = useSnackbar();
  const leave = useLeave();
  const applyDialog = useDisclosure();
  const [submitting, setSubmitting] = useState(false);

  const canApprove = user?.role === 'admin' || user?.role === 'hr' || user?.role === 'manager';
  const myEmployeeId = user?.employee?.id;

  const handleApply = async (values: LeaveFormValues) => {
    setSubmitting(true);
    try {
      await leave.apply({
        type: values.type,
        startDate: values.startDate,
        endDate: values.endDate,
        reason: values.reason || undefined,
      });
      notify('Leave request submitted', 'success');
      applyDialog.close();
    } catch (err) {
      notify((err as NormalizedError).message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const act = async (action: () => Promise<void>, successMsg: string) => {
    try {
      await action();
      notify(successMsg, 'success');
    } catch (err) {
      notify((err as NormalizedError).message, 'error');
    }
  };

  const columns: Column<LeaveRequestDTO>[] = [
    {
      key: 'employee',
      header: 'Employee',
      render: (r) => `${r.employee.firstName} ${r.employee.lastName}`,
    },
    {
      key: 'type',
      header: 'Type',
      render: (r) => r.type.charAt(0).toUpperCase() + r.type.slice(1),
    },
    { key: 'dates', header: 'Dates', render: (r) => `${r.startDate} → ${r.endDate}` },
    { key: 'status', header: 'Status', render: (r) => <LeaveStatusChip status={r.status} /> },
    {
      key: 'approver',
      header: 'Approver',
      render: (r) => (r.approver ? `${r.approver.firstName} ${r.approver.lastName}` : '—'),
    },
  ];

  return (
    <>
      <PageHeader
        title="Leave"
        subtitle={canApprove ? 'Review and manage leave requests' : 'Request and track your leave'}
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={applyDialog.open}>
            Apply for leave
          </Button>
        }
      />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          select
          size="small"
          label="Status"
          value={leave.status}
          onChange={(e) => leave.setStatus(e.target.value)}
          sx={{ minWidth: 180 }}
          InputLabelProps={{ shrink: true }}
        >
          <MenuItem value="">All statuses</MenuItem>
          {STATUS_FILTERS.map((o) => (
            <MenuItem key={o.value} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      <DataTable
        columns={columns}
        rows={leave.data}
        getRowId={(r) => r.id}
        loading={leave.loading}
        error={leave.error}
        onRetry={leave.refetch}
        emptyTitle="No leave requests"
        emptyDescription="Apply for leave using the button above."
        page={leave.page}
        limit={leave.limit}
        total={leave.total}
        onPageChange={leave.setPage}
        onLimitChange={leave.setLimit}
        rowActions={(r) => {
          if (r.status !== 'pending') return null;
          const isOwn = r.employee.id === myEmployeeId;
          return (
            <Box>
              {canApprove && (
                <>
                  <Tooltip title="Approve">
                    <IconButton
                      size="small"
                      color="success"
                      onClick={() => act(() => leave.approve(r.id), 'Leave approved')}
                    >
                      <CheckIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Reject">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => act(() => leave.reject(r.id), 'Leave rejected')}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </>
              )}
              {isOwn && (
                <Tooltip title="Cancel">
                  <IconButton
                    size="small"
                    onClick={() => act(() => leave.cancel(r.id), 'Leave cancelled')}
                  >
                    <CancelScheduleSendIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          );
        }}
      />

      <LeaveFormDialog
        open={applyDialog.isOpen}
        submitting={submitting}
        onClose={applyDialog.close}
        onSubmit={handleApply}
      />
    </>
  );
}
