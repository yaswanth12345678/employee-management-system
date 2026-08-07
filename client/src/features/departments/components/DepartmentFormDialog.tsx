import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Dialog, DialogActions, DialogContent, DialogTitle, Stack } from '@mui/material';
import type { DepartmentDTO } from '@ems/shared';
import { Button } from '../../../components/ui/Button';
import { FormTextField } from '../../../components/forms/FormTextField';
import { departmentFormSchema, type DepartmentFormValues } from '../validation';

interface DepartmentFormDialogProps {
  open: boolean;
  initial?: DepartmentDTO | null;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (values: DepartmentFormValues) => void;
}

const EMPTY_VALUES: DepartmentFormValues = { name: '', description: '' };

export function DepartmentFormDialog({
  open,
  initial,
  submitting = false,
  onClose,
  onSubmit,
}: DepartmentFormDialogProps) {
  const { control, handleSubmit, reset } = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    if (open) {
      reset(
        initial ? { name: initial.name, description: initial.description ?? '' } : EMPTY_VALUES,
      );
    }
  }, [open, initial, reset]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogTitle>{initial ? 'Edit department' : 'Add department'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormTextField control={control} name="name" label="Name" fullWidth autoFocus />
            <FormTextField control={control} name="description" label="Description" fullWidth multiline minRows={3} />
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
