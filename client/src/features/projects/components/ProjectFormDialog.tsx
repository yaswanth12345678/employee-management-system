import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Dialog, DialogActions, DialogContent, DialogTitle, Stack } from '@mui/material';
import type { ProjectDTO } from '@ems/shared';
import { Button } from '../../../components/ui/Button';
import { FormTextField } from '../../../components/forms/FormTextField';
import { FormAutocomplete } from '../../../components/forms/FormAutocomplete';
import { useDepartmentOptions } from '../../departments';
import { useEmployeeOptions } from '../../employees';
import { projectFormSchema, type ProjectFormValues } from '../validation';

const STATUS_OPTIONS = [
  { value: 'planning', label: 'Planning' },
  { value: 'active', label: 'Active' },
  { value: 'on_hold', label: 'On hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];
const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const EMPTY: ProjectFormValues = {
  code: '',
  name: '',
  description: '',
  departmentId: '',
  projectManagerId: '',
  status: 'planning',
  priority: 'medium',
  startDate: '',
  endDate: '',
  budget: '',
};

interface ProjectFormDialogProps {
  open: boolean;
  initial?: ProjectDTO | null;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (values: ProjectFormValues) => void;
}

export function ProjectFormDialog({ open, initial, submitting = false, onClose, onSubmit }: ProjectFormDialogProps) {
  const { options: departments } = useDepartmentOptions();
  const employees = useEmployeeOptions();

  const departmentOptions = useMemo(() => departments.map((d) => ({ id: d.id, label: d.name })), [departments]);
  const employeeOptions = useMemo(
    () => employees.map((e) => ({ id: e.id, label: `${e.firstName} ${e.lastName}` })),
    [employees],
  );

  const { control, handleSubmit, reset } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (!open) return;
    reset(
      initial
        ? {
            code: initial.code,
            name: initial.name,
            description: initial.description ?? '',
            departmentId: initial.department?.id ?? '',
            projectManagerId: initial.projectManager?.id ?? '',
            status: initial.status,
            priority: initial.priority,
            startDate: initial.startDate ?? '',
            endDate: initial.endDate ?? '',
            budget: initial.budget != null ? String(initial.budget) : '',
          }
        : EMPTY,
    );
  }, [open, initial, reset]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogTitle>{initial ? 'Edit project' : 'Add project'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormTextField control={control} name="code" label="Code" sx={{ maxWidth: { sm: 160 } }} fullWidth />
              <FormTextField control={control} name="name" label="Name" fullWidth />
            </Stack>
            <FormTextField control={control} name="description" label="Description" fullWidth multiline minRows={2} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormAutocomplete
                control={control}
                name="departmentId"
                label="Department"
                options={departmentOptions}
                currentLabel={initial?.department?.name}
              />
              <FormAutocomplete
                control={control}
                name="projectManagerId"
                label="Project manager"
                options={employeeOptions}
                currentLabel={
                  initial?.projectManager
                    ? `${initial.projectManager.firstName} ${initial.projectManager.lastName}`
                    : undefined
                }
              />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormTextField control={control} name="status" label="Status" options={STATUS_OPTIONS} fullWidth />
              <FormTextField control={control} name="priority" label="Priority" options={PRIORITY_OPTIONS} fullWidth />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormTextField
                control={control}
                name="startDate"
                label="Start date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <FormTextField
                control={control}
                name="endDate"
                label="End date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <FormTextField control={control} name="budget" label="Budget" type="number" fullWidth />
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
