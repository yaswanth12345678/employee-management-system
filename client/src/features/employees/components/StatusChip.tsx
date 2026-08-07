import { Chip } from '@mui/material';
import type { EmploymentStatus } from '@ems/shared';

type ChipColor = 'default' | 'success' | 'warning' | 'error' | 'info';

const STATUS_CONFIG: Record<EmploymentStatus, { label: string; color: ChipColor }> = {
  probation: { label: 'Probation', color: 'info' },
  active: { label: 'Active', color: 'success' },
  on_leave: { label: 'On leave', color: 'warning' },
  terminated: { label: 'Terminated', color: 'error' },
};

/** Renders an employment status as a small, color-coded chip. */
export function StatusChip({ status }: { status: EmploymentStatus }) {
  const config = STATUS_CONFIG[status];
  return <Chip size="small" variant="outlined" color={config.color} label={config.label} />;
}
