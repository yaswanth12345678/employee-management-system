import { Chip } from '@mui/material';
import type { AttendanceStatus } from '@ems/shared';

type ChipColor = 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary';

const STATUS: Record<AttendanceStatus, { label: string; color: ChipColor }> = {
  present: { label: 'Present', color: 'success' },
  absent: { label: 'Absent', color: 'error' },
  late: { label: 'Late', color: 'warning' },
  half_day: { label: 'Half day', color: 'info' },
  remote: { label: 'Remote', color: 'primary' },
};

export function AttendanceStatusChip({ status }: { status: AttendanceStatus }) {
  const c = STATUS[status];
  return <Chip size="small" variant="outlined" color={c.color} label={c.label} />;
}
