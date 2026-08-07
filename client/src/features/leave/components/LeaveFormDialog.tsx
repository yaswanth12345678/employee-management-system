import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Dialog, DialogActions, DialogContent, DialogTitle, Stack } from '@mui/material';
import { Button } from '../../../components/ui/Button';
import { FormTextField } from '../../../components/forms/FormTextField';
import { leaveFormSchema, type LeaveFormValues } from '../validation';

const TYPE_OPTIONS = [
  { value: 'annual', label: 'Annual' },
  { value: 'sick', label: 'Sick' },
  { value: 'casual', label: 'Casual' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'maternity', label: 'Maternity' },
  { value: 'paternity', label: 'Paternity' },
];

const EMPTY: LeaveFormValues = { type: 'annual', startDate: '', endDate: '', reason: '' };

interface LeaveFormDialogProps {
  open: boolean;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (values: LeaveFormValues) => void;
}

export function LeaveFormDialog({ open, submitting = false, onClose, onSubmit }: LeaveFormDialogProps) {
  const { control, handleSubmit, reset } = useForm<LeaveFormValues>({
    resolver: zodResolver(leaveFormSchema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (open) reset(EMPTY);
  }, [open, reset]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogTitle>Apply for leave</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormTextField control={control} name="type" label="Type" options={TYPE_OPTIONS} fullWidth />
            <Stack direction="row" spacing={2}>
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
            </Stack>
            <FormTextField control={control} name="reason" label="Reason" fullWidth multiline minRows={2} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit" disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" loading={submitting}>
            Submit
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
