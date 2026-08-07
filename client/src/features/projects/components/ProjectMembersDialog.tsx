import { useEffect, useState } from 'react';
import {
  Autocomplete,
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
import type { EmployeeDTO, ProjectDTO, ProjectMemberDTO } from '@ems/shared';
import { Button } from '../../../components/ui/Button';
import { useSnackbar } from '../../../contexts/SnackbarContext';
import { useEmployeeOptions } from '../../employees';
import type { NormalizedError } from '../../../lib/http';
import * as projectsApi from '../api/projectsApi';

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
  const [members, setMembers] = useState<ProjectMemberDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<EmployeeDTO | null>(null);
  const [role, setRole] = useState('');
  const [busy, setBusy] = useState(false);

  // `isActive` lets the initial-load effect abandon a stale response if the project changed while
  // the request was in flight; mutation callbacks call load() with the default (always apply).
  const load = async (projectId: string, isActive: () => boolean = () => true) => {
    setLoading(true);
    try {
      const list = await projectsApi.listMembers(projectId);
      if (isActive()) setMembers(list);
    } catch {
      if (isActive()) setMembers([]);
    } finally {
      if (isActive()) setLoading(false);
    }
  };

  useEffect(() => {
    if (!open || !project) return undefined;
    let active = true;
    setSelected(null);
    setRole('');
    void load(project.id, () => active);
    return () => {
      active = false;
    };
  }, [open, project]);

  const memberIds = new Set(members.map((m) => m.employee.id));
  const addable = employees.filter((e) => !memberIds.has(e.id));

  const handleAdd = async () => {
    if (!project || !selected) return;
    setBusy(true);
    try {
      await projectsApi.addMember(project.id, {
        employeeId: selected.id,
        roleOnProject: role || undefined,
      });
      setSelected(null);
      setRole('');
      await load(project.id);
      onChanged();
      notify('Member added', 'success');
    } catch (err) {
      notify((err as NormalizedError).message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (employeeId: string) => {
    if (!project) return;
    try {
      await projectsApi.removeMember(project.id, employeeId);
      await load(project.id);
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
                      <IconButton edge="end" color="error" onClick={() => handleRemove(m.employee.id)}>
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
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: '100%' }}>
            <Autocomplete
              options={addable}
              getOptionLabel={(o) => `${o.firstName} ${o.lastName}`}
              value={selected}
              onChange={(_e, value) => setSelected(value)}
              size="small"
              sx={{ flex: 1, minWidth: 180 }}
              renderInput={(params) => <TextField {...params} label="Employee" />}
            />
            <TextField
              label="Role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              size="small"
              sx={{ minWidth: 140 }}
            />
            <Button variant="contained" onClick={handleAdd} loading={busy} disabled={!selected}>
              Add
            </Button>
          </Stack>
        </DialogActions>
      )}
    </Dialog>
  );
}
