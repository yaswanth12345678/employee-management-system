import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Autocomplete,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import type { EmployeeDTO, ProjectDTO } from '@ems/shared';
import { Button } from '../../../components/ui/Button';
import { FormTextField } from '../../../components/forms/FormTextField';
import { useSnackbar } from '../../../contexts/SnackbarContext';
import { useEmployeeOptions } from '../../employees';
import type { NormalizedError } from '../../../lib/http';
import { useProjectMembers } from '../hooks/useProjectMembers';
import { projectMemberSchema, type ProjectMemberValues } from '../validation';

interface ProjectMembersDialogProps {
  open: boolean;
  project: ProjectDTO | null;
  canWrite: boolean;
  onClose: () => void;
  onChanged: () => void;
}

export function ProjectMembersDialog({
  open,
  project,
  canWrite,
  onClose,
  onChanged,
}: ProjectMembersDialogProps) {
  const { notify } = useSnackbar();
  const employees = useEmployeeOptions();
  const { members, loading, busy, addMember, removeMember } = useProjectMembers(
    project?.id ?? null,
    open,
  );

  const { control, handleSubmit, reset, setValue, watch } = useForm<ProjectMemberValues>({
    resolver: zodResolver(projectMemberSchema),
    defaultValues: { employeeId: '', roleOnProject: '' },
  });

  useEffect(() => {
    if (open) reset({ employeeId: '', roleOnProject: '' });
  }, [open, project?.id, reset]);

  const memberIds = useMemo(() => new Set(members.map((m) => m.employee.id)), [members]);
  const addable = employees.filter((e) => !memberIds.has(e.id));
  const selectedId = watch('employeeId');
  const selected =
    addable.find((e) => e.id === selectedId) ?? employees.find((e) => e.id === selectedId) ?? null;

  const onSubmit = async (values: ProjectMemberValues) => {
    try {
      await addMember(values.employeeId, values.roleOnProject || undefined);
      reset({ employeeId: '', roleOnProject: '' });
      onChanged();
      notify('Member added', 'success');
    } catch (err) {
      notify((err as NormalizedError).message, 'error');
    }
  };

  const handleRemove = async (employeeId: string) => {
    try {
      await removeMember(employeeId);
      onChanged();
      notify('Member removed', 'success');
    } catch (err) {
      notify((err as NormalizedError).message, 'error');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{project ? `Members — ${project.name}` : 'Members'}</DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Typography variant="body2" color="text.secondary">
            Loading…
          </Typography>
        ) : members.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No members assigned yet.
          </Typography>
        ) : (
          <List dense>
            {members.map((m) => (
              <ListItem
                key={m.employee.id}
                secondaryAction={
                  canWrite ? (
                    <Tooltip title="Remove">
                      <IconButton
                        edge="end"
                        color="error"
                        onClick={() => handleRemove(m.employee.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  ) : null
                }
              >
                <ListItemText
                  primary={`${m.employee.firstName} ${m.employee.lastName}`}
                  secondary={m.roleOnProject ?? '—'}
                />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      {canWrite && (
        <DialogActions sx={{ p: 2 }}>
          <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            sx={{ width: '100%' }}
          >
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: '100%' }}>
              <Controller
                control={control}
                name="employeeId"
                render={({ field, fieldState }) => (
                  <Autocomplete
                    options={addable}
                    getOptionLabel={(o: EmployeeDTO) => `${o.firstName} ${o.lastName}`}
                    value={selected}
                    onChange={(_e, value) => {
                      field.onChange(value?.id ?? '');
                      setValue('employeeId', value?.id ?? '', { shouldValidate: true });
                    }}
                    size="small"
                    sx={{ flex: 1, minWidth: 180 }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Employee"
                        error={Boolean(fieldState.error)}
                        helperText={fieldState.error?.message}
                      />
                    )}
                  />
                )}
              />
              <FormTextField
                control={control}
                name="roleOnProject"
                label="Role"
                size="small"
                sx={{ minWidth: 140 }}
              />
              <Button type="submit" variant="contained" loading={busy} disabled={!selectedId}>
                Add
              </Button>
            </Stack>
          </Box>
        </DialogActions>
      )}
    </Dialog>
  );
}
