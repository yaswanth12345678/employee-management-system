import { useEffect, useMemo } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Dialog, DialogActions, DialogContent, DialogTitle, Stack } from '@mui/material';
import type { EmployeeDTO } from '@ems/shared';
import { Button } from '../../../components/ui/Button';
import { FormTextField } from '../../../components/forms/FormTextField';
import { FormAutocomplete } from '../../../components/forms/FormAutocomplete';
import { useDepartmentOptions } from '../../departments';
import { useEmployeeOptions } from '../hooks/useEmployeeOptions';
import {
  createEmployeeFormSchema,
  editEmployeeFormSchema,
  type EmployeeFormValues,
} from '../validation';

const ROLE_OPTIONS = [
  { value: 'employee', label: 'Employee' },
  { value: 'manager', label: 'Manager' },
  { value: 'hr', label: 'HR' },
  { value: 'admin', label: 'Admin' },
];
const STATUS_OPTIONS = [
  { value: 'probation', label: 'Probation' },
  { value: 'active', label: 'Active' },
  { value: 'on_leave', label: 'On leave' },
  { value: 'terminated', label: 'Terminated' },
];

const EMPTY_VALUES: EmployeeFormValues = {
  email: '',
  password: '',
  roleName: 'employee',
  firstName: '',
  lastName: '',
  jobTitle: '',
  departmentId: '',
  managerId: '',
  hireDate: '',
  phone: '',
  status: 'probation',
};

interface EmployeeFormDialogProps {
  open: boolean;
  initial?: EmployeeDTO | null;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (values: EmployeeFormValues) => void;
}

export function EmployeeFormDialog({
  open,
  initial,
  submitting = false,
  onClose,
  onSubmit,
}: EmployeeFormDialogProps) {
  const isEdit = Boolean(initial);
  const { options: departments } = useDepartmentOptions();
  const employees = useEmployeeOptions();

  const departmentOptions = useMemo(() => departments.map((d) => ({ id: d.id, label: d.name })), [departments]);
  const managerOptions = useMemo(
    () =>
      employees
        .filter((e) => e.id !== initial?.id)
        .map((e) => ({ id: e.id, label: `${e.firstName} ${e.lastName}` })),
    [employees, initial?.id],
  );

  const { control, handleSubmit, reset } = useForm<EmployeeFormValues>({
    resolver: (isEdit
      ? zodResolver(editEmployeeFormSchema)
      : zodResolver(createEmployeeFormSchema)) as unknown as Resolver<EmployeeFormValues>,
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    if (!open) return;
    reset(
      initial
        ? {
            ...EMPTY_VALUES,
            email: initial.email,
            roleName: initial.role,
            firstName: initial.firstName,
            lastName: initial.lastName,
            jobTitle: initial.jobTitle ?? '',
            departmentId: initial.department?.id ?? '',
            managerId: initial.manager?.id ?? '',
            hireDate: initial.hireDate,
            phone: initial.phone ?? '',
            status: initial.status,
          }
        : EMPTY_VALUES,
    );
  }, [open, initial, reset]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogTitle>{isEdit ? 'Edit employee' : 'Add employee'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormTextField control={control} name="firstName" label="First name" fullWidth />
              <FormTextField control={control} name="lastName" label="Last name" fullWidth />
            </Stack>

            {!isEdit && (
              <>
                <FormTextField control={control} name="email" label="Email" type="email" fullWidth />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <FormTextField
                    control={control}
                    name="password"
                    label="Temporary password"
                    type="password"
                    fullWidth
                  />
                  <FormTextField control={control} name="roleName" label="Role" options={ROLE_OPTIONS} fullWidth />
                </Stack>
              </>
            )}

            <FormTextField control={control} name="jobTitle" label="Job title" fullWidth />

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
                name="managerId"
                label="Manager"
                options={managerOptions}
                currentLabel={initial?.manager ? `${initial.manager.firstName} ${initial.manager.lastName}` : undefined}
              />
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              {!isEdit && (
                <FormTextField
                  control={control}
                  name="hireDate"
                  label="Hire date"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              )}
              {isEdit && (
                <FormTextField control={control} name="status" label="Status" options={STATUS_OPTIONS} fullWidth />
              )}
              <FormTextField control={control} name="phone" label="Phone" fullWidth />
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
