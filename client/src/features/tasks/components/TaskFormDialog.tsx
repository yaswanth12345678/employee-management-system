import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Dialog, DialogActions, DialogContent, DialogTitle, Stack } from '@mui/material';
import type { TaskDTO } from '@ems/shared';
import { Button } from '../../../components/ui/Button';
import { FormTextField } from '../../../components/forms/FormTextField';
import { FormAutocomplete } from '../../../components/forms/FormAutocomplete';
import { useProjectOptions } from '../../projects';
import { useEmployeeOptions } from '../../employees';
import { taskFormSchema, type TaskFormValues } from '../validation';

const STATUS_OPTIONS = [
  { value: 'todo', label: 'To do' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'in_review', label: 'In review' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'done', label: 'Done' },
];
const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const EMPTY: TaskFormValues = {
  projectId: '',
  title: '',
  description: '',
  assigneeId: '',
  status: 'todo',
  priority: 'medium',
  dueDate: '',
  estimatedHours: '',
};

interface TaskFormDialogProps {
  open: boolean;
  initial?: TaskDTO | null;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (values: TaskFormValues) => void;
}

export function TaskFormDialog({ open, initial, submitting = false, onClose, onSubmit }: TaskFormDialogProps) {
  const projects = useProjectOptions();
  const employees = useEmployeeOptions();
  const isEdit = Boolean(initial);

  const projectOptions = useMemo(
    () => projects.map((p) => ({ id: p.id, label: `${p.code} — ${p.name}` })),
    [projects],
  );
  const employeeOptions = useMemo(
    () => employees.map((e) => ({ id: e.id, label: `${e.firstName} ${e.lastName}` })),
    [employees],
  );

  const { control, handleSubmit, reset } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (!open) return;
    reset(
      initial
        ? {
            projectId: initial.projectId,
            title: initial.title,
            description: initial.description ?? '',
            assigneeId: initial.assignee?.id ?? '',
            status: initial.status,
            priority: initial.priority,
            dueDate: initial.dueDate ?? '',
            estimatedHours: initial.estimatedHours != null ? String(initial.estimatedHours) : '',
          }
        : EMPTY,
    );
  }, [open, initial, reset]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogTitle>{isEdit ? 'Edit task' : 'Add task'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormAutocomplete
              control={control}
              name="projectId"
              label="Project"
              options={projectOptions}
              currentLabel={initial ? projectOptions.find((o) => o.id === initial.projectId)?.label : undefined}
              disabled={isEdit}
            />
            <FormTextField control={control} name="title" label="Title" fullWidth />
            <FormTextField control={control} name="description" label="Description" fullWidth multiline minRows={2} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormAutocomplete
                control={control}
                name="assigneeId"
                label="Assignee"
                options={employeeOptions}
                currentLabel={
                  initial?.assignee ? `${initial.assignee.firstName} ${initial.assignee.lastName}` : undefined
                }
              />
              <FormTextField control={control} name="status" label="Status" options={STATUS_OPTIONS} fullWidth />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormTextField control={control} name="priority" label="Priority" options={PRIORITY_OPTIONS} fullWidth />
              <FormTextField
                control={control}
                name="dueDate"
                label="Due date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <FormTextField control={control} name="estimatedHours" label="Est. hours" type="number" fullWidth />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit" disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" loading={submitting}>
            Save
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
