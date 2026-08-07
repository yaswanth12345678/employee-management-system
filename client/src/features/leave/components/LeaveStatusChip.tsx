import { Chip } from '@mui/material';
import type { LeaveStatus } from '@ems/shared';

type ChipColor = 'default' | 'success' | 'warning' | 'error';

const STATUS: Record<LeaveStatus, { label: string; color: ChipColor }> = {
  pending: { label: 'Pending', color: 'warning' },
  approved: { label: 'Approved', color: 'success' },
  rejected: { label: 'Rejected', color: 'error' },
  cancelled: { label: 'Cancelled', color: 'default' },
};

export function LeaveStatusChip({ status }: { status: LeaveStatus }) {
  const c = STATUS[status];
  return <Chip size="small" variant="outlined" color={c.color} label={c.label} />;
}
