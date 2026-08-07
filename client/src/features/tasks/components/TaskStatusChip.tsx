import { Chip } from '@mui/material';
import type { TaskStatus } from '@ems/shared';

type ChipColor = 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary';

const STATUS: Record<TaskStatus, { label: string; color: ChipColor }> = {
  todo: { label: 'To do', color: 'default' },
  in_progress: { label: 'In progress', color: 'info' },
  in_review: { label: 'In review', color: 'primary' },
  blocked: { label: 'Blocked', color: 'error' },
  done: { label: 'Done', color: 'success' },
};

export function TaskStatusChip({ status }: { status: TaskStatus }) {
  const c = STATUS[status];
  return <Chip size="small" variant="outlined" color={c.color} label={c.label} />;
}
