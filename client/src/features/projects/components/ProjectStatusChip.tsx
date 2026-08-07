import { Chip } from '@mui/material';
import type { PriorityLevel, ProjectStatus } from '@ems/shared';

type ChipColor = 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary';

const STATUS: Record<ProjectStatus, { label: string; color: ChipColor }> = {
  planning: { label: 'Planning', color: 'info' },
  active: { label: 'Active', color: 'success' },
  on_hold: { label: 'On hold', color: 'warning' },
  completed: { label: 'Completed', color: 'default' },
  cancelled: { label: 'Cancelled', color: 'error' },
};

const PRIORITY: Record<PriorityLevel, { label: string; color: ChipColor }> = {
  low: { label: 'Low', color: 'default' },
  medium: { label: 'Medium', color: 'info' },
  high: { label: 'High', color: 'warning' },
  critical: { label: 'Critical', color: 'error' },
};

export function ProjectStatusChip({ status }: { status: ProjectStatus }) {
  const c = STATUS[status];
  return <Chip size="small" variant="outlined" color={c.color} label={c.label} />;
}

export function PriorityChip({ priority }: { priority: PriorityLevel }) {
  const c = PRIORITY[priority];
  return <Chip size="small" variant="outlined" color={c.color} label={c.label} />;
}
