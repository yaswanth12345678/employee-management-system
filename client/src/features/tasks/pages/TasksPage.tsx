import { useEffect, useMemo, useState } from 'react';
import { Badge, Box, IconButton, MenuItem, Stack, TextField, Tooltip, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import type { TaskDTO } from '@ems/shared';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Button } from '../../../components/ui/Button';
import { SearchBar } from '../../../components/ui/SearchBar';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { ConfirmDialog } from '../../../components/feedback/ConfirmDialog';
import { useAuth } from '../../../contexts/AuthContext';
import { useCrudPage } from '../../../hooks/useCrudPage';
import { useProjectOptions, PriorityChip } from '../../projects';
import { useTasks } from '../hooks/useTasks';
import { TaskFormDialog } from '../components/TaskFormDialog';
import { TaskCommentsDialog } from '../components/TaskCommentsDialog';
import { TaskStatusChip } from '../components/TaskStatusChip';
import { onRealtime } from '../../../lib/realtime/socket';
import type { TaskFormValues } from '../validation';
import * as tasksApi from '../api/tasksApi';

const STATUS_FILTERS = [
  { value: 'todo', label: 'To do' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'in_review', label: 'In review' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'done', label: 'Done' },
];

function toPayload(values: TaskFormValues) {
  return {
    title: values.title,
    description: values.description || undefined,
    assigneeId: values.assigneeId || null,
    status: values.status,
    priority: values.priority,
    dueDate: values.dueDate || null,
    estimatedHours: values.estimatedHours ? Number(values.estimatedHours) : null,
  };
}

export function TasksPage() {
  const { user } = useAuth();
  const task = useTasks();
  const projects = useProjectOptions();
  const projectNameById = useMemo(
    () => new Map(projects.map((p) => [p.id, `${p.code}`])),
    [projects],
  );

  const [commentsFor, setCommentsFor] = useState<TaskDTO | null>(null);

  const crud = useCrudPage<TaskDTO, TaskFormValues>({
    entityName: 'Task',
    list: { data: task.data, page: task.page, setPage: task.setPage, refetch: task.refetch },
    create: (v) => tasksApi.create({ projectId: v.projectId, ...toPayload(v) }),
    update: (row, v) => tasksApi.update(row.id, toPayload(v)),
    remove: (row) => tasksApi.remove(row.id),
  });

  // Live: refresh the task list when any task's status changes elsewhere.
  useEffect(() => {
    const off = onRealtime((message) => {
      if (message.type === 'task_updated') void task.refetch();
    });
    return off;
  }, [task.refetch]);

  const canWrite = user?.role === 'admin' || user?.role === 'manager';

  const columns: Column<TaskDTO>[] = [
    { key: 'title', header: 'Title', render: (t) => <Typography variant="body2" fontWeight={600}>{t.title}</Typography> },
    { key: 'project', header: 'Project', render: (t) => projectNameById.get(t.projectId) ?? '—' },
    { key: 'status', header: 'Status', render: (t) => <TaskStatusChip status={t.status} /> },
    { key: 'priority', header: 'Priority', render: (t) => <PriorityChip priority={t.priority} /> },
    { key: 'assignee', header: 'Assignee', render: (t) => (t.assignee ? `${t.assignee.firstName} ${t.assignee.lastName}` : '—') },
    { key: 'due', header: 'Due', render: (t) => t.dueDate ?? '—' },
  ];

  return (
    <>
      <PageHeader
        title="Tasks"
        subtitle="Track work across your projects"
        action={
          canWrite ? (
            <Button variant="contained" startIcon={<AddIcon />} onClick={crud.openCreate}>
              Add task
            </Button>
          ) : undefined
        }
      />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <SearchBar placeholder="Search tasks…" onSearch={task.setSearch} />
        <TextField
          select
          size="small"
          label="Project"
          value={task.projectId}
          onChange={(e) => task.setProjectId(e.target.value)}
          sx={{ minWidth: 180 }}
          InputLabelProps={{ shrink: true }}
        >
          <MenuItem value="">All projects</MenuItem>
          {projects.map((p) => (
            <MenuItem key={p.id} value={p.id}>
              {p.code} — {p.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Status"
          value={task.status}
          onChange={(e) => task.setStatus(e.target.value)}
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
      </Stack>

      <DataTable
        columns={columns}
        rows={task.data}
        getRowId={(t) => t.id}
        loading={task.loading}
        error={task.error}
        onRetry={task.refetch}
        emptyTitle="No tasks found"
        emptyDescription={canWrite ? 'Create a task to get started.' : undefined}
        page={task.page}
        limit={task.limit}
        total={task.total}
        onPageChange={task.setPage}
        onLimitChange={task.setLimit}
        rowActions={(t) => (
          <Box>
            <Tooltip title="Comments">
              <IconButton size="small" onClick={() => setCommentsFor(t)}>
                <Badge badgeContent={t.commentCount} color="primary">
                  <ChatBubbleOutlineIcon fontSize="small" />
                </Badge>
              </IconButton>
            </Tooltip>
            {canWrite && (
              <Tooltip title="Edit">
                <IconButton size="small" onClick={() => crud.openEdit(t)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {canWrite && (
              <Tooltip title="Delete">
                <IconButton size="small" color="error" onClick={() => crud.requestDelete(t)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )}
      />

      <TaskFormDialog
        open={crud.formOpen}
        initial={crud.editing}
        submitting={crud.submitting}
        onClose={crud.closeForm}
        onSubmit={crud.submit}
      />

      <ConfirmDialog
        open={Boolean(crud.toDelete)}
        title="Delete task?"
        description={crud.toDelete ? `"${crud.toDelete.title}" will be permanently removed.` : ''}
        confirmLabel="Delete"
        loading={crud.deleting}
        onConfirm={crud.confirmDelete}
        onClose={crud.cancelDelete}
      />

      <TaskCommentsDialog
        open={Boolean(commentsFor)}
        task={commentsFor}
        onClose={() => setCommentsFor(null)}
        onChanged={() => void task.refetch()}
      />
    </>
  );
}
