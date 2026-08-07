import { Avatar, Box, IconButton, MenuItem, Stack, TextField, Tooltip, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import type { EmployeeDTO } from '@ems/shared';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Button } from '../../../components/ui/Button';
import { SearchBar } from '../../../components/ui/SearchBar';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { ConfirmDialog } from '../../../components/feedback/ConfirmDialog';
import { useAuth } from '../../../contexts/AuthContext';
import { useCrudPage } from '../../../hooks/useCrudPage';
import { useDepartmentOptions } from '../../departments';
import { useEmployees } from '../hooks/useEmployees';
import { EmployeeFormDialog } from '../components/EmployeeFormDialog';
import { StatusChip } from '../components/StatusChip';
import type { EmployeeFormValues } from '../validation';
import * as employeesApi from '../api/employeesApi';

const STATUS_FILTERS = [
  { value: 'probation', label: 'Probation' },
  { value: 'active', label: 'Active' },
  { value: 'on_leave', label: 'On leave' },
  { value: 'terminated', label: 'Terminated' },
];

export function EmployeesPage() {
  const { user } = useAuth();
  const emp = useEmployees();
  const { options: departments } = useDepartmentOptions();

  const crud = useCrudPage<EmployeeDTO, EmployeeFormValues>({
    entityName: 'Employee',
    list: { data: emp.data, page: emp.page, setPage: emp.setPage, refetch: emp.refetch },
    // Create sends credentials + role; edit sends only the mutable profile fields.
    create: (v) =>
      employeesApi.create({
        email: v.email,
        password: v.password,
        roleName: v.roleName,
        firstName: v.firstName,
        lastName: v.lastName,
        jobTitle: v.jobTitle || undefined,
        departmentId: v.departmentId || null,
        managerId: v.managerId || null,
        hireDate: v.hireDate,
        phone: v.phone || undefined,
      }),
    update: (row, v) =>
      employeesApi.update(row.id, {
        firstName: v.firstName,
        lastName: v.lastName,
        jobTitle: v.jobTitle || null,
        departmentId: v.departmentId || null,
        managerId: v.managerId || null,
        phone: v.phone || null,
        status: v.status,
      }),
    remove: (row) => employeesApi.remove(row.id),
  });

  const canWrite = user?.role === 'admin' || user?.role === 'hr';
  const canDelete = user?.role === 'admin';

  const columns: Column<EmployeeDTO>[] = [
    {
      key: 'name',
      header: 'Employee',
      render: (e) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar src={e.avatarUrl} sx={{ width: 32, height: 32 }}>
            {e.firstName.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={600}>
              {e.firstName} {e.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {e.employeeCode}
            </Typography>
          </Box>
        </Box>
      ),
    },
    { key: 'email', header: 'Email', render: (e) => e.email },
    { key: 'role', header: 'Role', render: (e) => e.role },
    { key: 'department', header: 'Department', render: (e) => e.department?.name ?? '—' },
    { key: 'status', header: 'Status', render: (e) => <StatusChip status={e.status} /> },
  ];

  return (
    <>
      <PageHeader
        title="Employees"
        subtitle="Manage your organization's people"
        action={
          canWrite ? (
            <Button variant="contained" startIcon={<AddIcon />} onClick={crud.openCreate}>
              Add employee
            </Button>
          ) : undefined
        }
      />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <SearchBar placeholder="Search employees…" onSearch={emp.setSearch} />
        <TextField
          select
          size="small"
          label="Department"
          value={emp.departmentId}
          onChange={(e) => emp.setDepartmentId(e.target.value)}
          sx={{ minWidth: 180 }}
          InputLabelProps={{ shrink: true }}
        >
          <MenuItem value="">All departments</MenuItem>
          {departments.map((dept) => (
            <MenuItem key={dept.id} value={dept.id}>
              {dept.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Status"
          value={emp.status}
          onChange={(e) => emp.setStatus(e.target.value)}
          sx={{ minWidth: 160 }}
          InputLabelProps={{ shrink: true }}
        >
          <MenuItem value="">All statuses</MenuItem>
          {STATUS_FILTERS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      <DataTable
        columns={columns}
        rows={emp.data}
        getRowId={(e) => e.id}
        loading={emp.loading}
        error={emp.error}
        onRetry={emp.refetch}
        emptyTitle="No employees found"
        emptyDescription={canWrite ? 'Add your first employee to get started.' : undefined}
        page={emp.page}
        limit={emp.limit}
        total={emp.total}
        onPageChange={emp.setPage}
        onLimitChange={emp.setLimit}
        rowActions={
          canWrite || canDelete
            ? (e) => (
                <>
                  {canWrite && (
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => crud.openEdit(e)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {canDelete && (
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => crud.requestDelete(e)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </>
              )
            : undefined
        }
      />

      <EmployeeFormDialog
        open={crud.formOpen}
        initial={crud.editing}
        submitting={crud.submitting}
        onClose={crud.closeForm}
        onSubmit={crud.submit}
      />

      <ConfirmDialog
        open={Boolean(crud.toDelete)}
        title="Delete employee?"
        description={
          crud.toDelete
            ? `${crud.toDelete.firstName} ${crud.toDelete.lastName} and their user account will be permanently removed.`
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
