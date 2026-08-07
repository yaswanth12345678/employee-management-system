import { Box, IconButton, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import type { DepartmentDTO } from '@ems/shared';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Button } from '../../../components/ui/Button';
import { SearchBar } from '../../../components/ui/SearchBar';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { ConfirmDialog } from '../../../components/feedback/ConfirmDialog';
import { useAuth } from '../../../contexts/AuthContext';
import { useCrudPage } from '../../../hooks/useCrudPage';
import { useDepartments } from '../hooks/useDepartments';
import { DepartmentFormDialog } from '../components/DepartmentFormDialog';
import * as departmentsApi from '../api/departmentsApi';
import type { DepartmentFormValues } from '../validation';

/**
 * Departments management screen — the orchestrator. Fetching lives in useDepartments, the
 * create/edit/delete interaction wiring in useCrudPage, and rendering in the shared components;
 * this page composes them and owns only its columns + search. Role gating mirrors the backend RBAC.
 */
export function DepartmentsPage() {
  const { user } = useAuth();
  const { data, total, loading, error, page, limit, setPage, setLimit, setSearch, refetch } =
    useDepartments();

  const crud = useCrudPage<DepartmentDTO, DepartmentFormValues>({
    entityName: 'Department',
    list: { data, page, setPage, refetch },
    create: (v) => departmentsApi.create({ name: v.name, description: v.description || undefined }),
    update: (row, v) =>
      departmentsApi.update(row.id, { name: v.name, description: v.description || undefined }),
    remove: (row) => departmentsApi.remove(row.id),
  });

  const canWrite = user?.role === 'admin' || user?.role === 'hr';
  const canDelete = user?.role === 'admin';

  const columns: Column<DepartmentDTO>[] = [
    { key: 'name', header: 'Name' },
    { key: 'description', header: 'Description', render: (d) => d.description ?? '—' },
    {
      key: 'head',
      header: 'Head',
      render: (d) => (d.head ? `${d.head.firstName} ${d.head.lastName}` : '—'),
    },
    { key: 'employeeCount', header: 'Employees', align: 'right', render: (d) => d.employeeCount },
  ];

  return (
    <>
      <PageHeader
        title="Departments"
        subtitle="Organize your company into departments"
        action={
          canWrite ? (
            <Button variant="contained" startIcon={<AddIcon />} onClick={crud.openCreate}>
              Add department
            </Button>
          ) : undefined
        }
      />

      <Box sx={{ mb: 2 }}>
        <SearchBar placeholder="Search departments…" onSearch={setSearch} />
      </Box>

      <DataTable
        columns={columns}
        rows={data}
        getRowId={(d) => d.id}
        loading={loading}
        error={error}
        onRetry={refetch}
        emptyTitle="No departments found"
        emptyDescription={canWrite ? 'Create your first department to get started.' : undefined}
        page={page}
        limit={limit}
        total={total}
        onPageChange={setPage}
        onLimitChange={setLimit}
        rowActions={
          canWrite || canDelete
            ? (d) => (
                <>
                  {canWrite && (
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => crud.openEdit(d)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {canDelete && (
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => crud.requestDelete(d)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </>
              )
            : undefined
        }
      />

      <DepartmentFormDialog
        open={crud.formOpen}
        initial={crud.editing}
        submitting={crud.submitting}
        onClose={crud.closeForm}
        onSubmit={crud.submit}
      />

      <ConfirmDialog
        open={Boolean(crud.toDelete)}
        title="Delete department?"
        description={
          crud.toDelete
            ? `"${crud.toDelete.name}" will be permanently removed. This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        loading={crud.deleting}
        onConfirm={crud.confirmDelete}
        onClose={crud.cancelDelete}
      />
    </>
  );
}
