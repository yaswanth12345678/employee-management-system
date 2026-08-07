import { useState } from 'react';
import { Badge, Box, IconButton, MenuItem, Stack, TextField, Tooltip, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import GroupIcon from '@mui/icons-material/Group';
import type { ProjectDTO } from '@ems/shared';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Button } from '../../../components/ui/Button';
import { SearchBar } from '../../../components/ui/SearchBar';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { ConfirmDialog } from '../../../components/feedback/ConfirmDialog';
import { useAuth } from '../../../contexts/AuthContext';
import { useCrudPage } from '../../../hooks/useCrudPage';
import { useProjects } from '../hooks/useProjects';
import { ProjectFormDialog } from '../components/ProjectFormDialog';
import { ProjectMembersDialog } from '../components/ProjectMembersDialog';
import { PriorityChip, ProjectStatusChip } from '../components/ProjectStatusChip';
import type { ProjectFormValues } from '../validation';
import * as projectsApi from '../api/projectsApi';

const STATUS_FILTERS = [
  { value: 'planning', label: 'Planning' },
  { value: 'active', label: 'Active' },
  { value: 'on_hold', label: 'On hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];
const PRIORITY_FILTERS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

/** Convert form values → API payload (empty strings → null/undefined, budget → number). */
function toPayload(values: ProjectFormValues) {
  return {
    code: values.code,
    name: values.name,
    description: values.description || undefined,
    departmentId: values.departmentId || null,
    projectManagerId: values.projectManagerId || null,
    status: values.status,
    priority: values.priority,
    startDate: values.startDate || null,
    endDate: values.endDate || null,
    budget: values.budget ? Number(values.budget) : null,
  };
}

export function ProjectsPage() {
  const { user } = useAuth();
  const proj = useProjects();
  const [membersFor, setMembersFor] = useState<ProjectDTO | null>(null);

  const crud = useCrudPage<ProjectDTO, ProjectFormValues>({
    entityName: 'Project',
    list: { data: proj.data, page: proj.page, setPage: proj.setPage, refetch: proj.refetch },
    create: (v) => projectsApi.create(toPayload(v)),
    update: (row, v) => projectsApi.update(row.id, toPayload(v)),
    remove: (row) => projectsApi.remove(row.id),
  });

  const canWrite = user?.role === 'admin' || user?.role === 'manager';

  const columns: Column<ProjectDTO>[] = [
    { key: 'code', header: 'Code', render: (p) => <Typography variant="body2" fontWeight={600}>{p.code}</Typography> },
    { key: 'name', header: 'Name', render: (p) => p.name },
    { key: 'status', header: 'Status', render: (p) => <ProjectStatusChip status={p.status} /> },
    { key: 'priority', header: 'Priority', render: (p) => <PriorityChip priority={p.priority} /> },
    {
      key: 'pm',
      header: 'Manager',
      render: (p) => (p.projectManager ? `${p.projectManager.firstName} ${p.projectManager.lastName}` : '—'),
    },
    { key: 'members', header: 'Members', align: 'right', render: (p) => p.memberCount },
    { key: 'tasks', header: 'Tasks', align: 'right', render: (p) => p.taskCount },
  ];

  return (
    <>
      <PageHeader
        title="Projects"
        subtitle="Track and manage your organization's projects"
        action={
          canWrite ? (
            <Button variant="contained" startIcon={<AddIcon />} onClick={crud.openCreate}>
              Add project
            </Button>
          ) : undefined
        }
      />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <SearchBar placeholder="Search projects…" onSearch={proj.setSearch} />
        <TextField
          select
          size="small"
          label="Status"
          value={proj.status}
          onChange={(e) => proj.setStatus(e.target.value)}
          sx={{ minWidth: 160 }}
          InputLabelProps={{ shrink: true }}
        >
          <MenuItem value="">All statuses</MenuItem>
          {STATUS_FILTERS.map((o) => (
            <MenuItem key={o.value} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Priority"
          value={proj.priority}
          onChange={(e) => proj.setPriority(e.target.value)}
          sx={{ minWidth: 160 }}
          InputLabelProps={{ shrink: true }}
        >
          <MenuItem value="">All priorities</MenuItem>
          {PRIORITY_FILTERS.map((o) => (
            <MenuItem key={o.value} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      <DataTable
        columns={columns}
        rows={proj.data}
        getRowId={(p) => p.id}
        loading={proj.loading}
        error={proj.error}
        onRetry={proj.refetch}
        emptyTitle="No projects found"
        emptyDescription={canWrite ? 'Create your first project to get started.' : undefined}
        page={proj.page}
        limit={proj.limit}
        total={proj.total}
        onPageChange={proj.setPage}
        onLimitChange={proj.setLimit}
        rowActions={(p) => (
          <Box>
            <Tooltip title="Members">
              <IconButton size="small" onClick={() => setMembersFor(p)}>
                <Badge badgeContent={p.memberCount} color="primary">
                  <GroupIcon fontSize="small" />
                </Badge>
              </IconButton>
            </Tooltip>
            {canWrite && (
              <Tooltip title="Edit">
                <IconButton size="small" onClick={() => crud.openEdit(p)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {canWrite && (
              <Tooltip title="Delete">
                <IconButton size="small" color="error" onClick={() => crud.requestDelete(p)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )}
      />

      <ProjectFormDialog
        open={crud.formOpen}
        initial={crud.editing}
        submitting={crud.submitting}
        onClose={crud.closeForm}
        onSubmit={crud.submit}
      />

      <ConfirmDialog
        open={Boolean(crud.toDelete)}
        title="Delete project?"
        description={
          crud.toDelete
            ? `"${crud.toDelete.name}" and all its tasks will be permanently removed.`
            : ''
        }
        confirmLabel="Delete"
        loading={crud.deleting}
        onConfirm={crud.confirmDelete}
        onClose={crud.cancelDelete}
      />

      <ProjectMembersDialog
        open={Boolean(membersFor)}
        project={membersFor}
        canWrite={canWrite}
        onClose={() => setMembersFor(null)}
        onChanged={() => void proj.refetch()}
      />
    </>
  );
}
