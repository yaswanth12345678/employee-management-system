import { useState, type ReactNode } from 'react';
import {
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import type { EmployeeDTO } from '@ems/shared';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Button } from '../../../components/ui/Button';
import { SearchBar } from '../../../components/ui/SearchBar';
import { ConfirmDialog } from '../../../components/feedback/ConfirmDialog';
import { useAuth } from '../../../contexts/AuthContext';
import { useCrudPage } from '../../../hooks/useCrudPage';
import { useDepartmentOptions } from '../../departments';
import { useEmployees } from '../hooks/useEmployees';
import { EmployeeCard } from '../components/EmployeeCard';
import { EmployeeFeed, type FeedOrientation } from '../components/EmployeeFeed';
import { EmployeeFormDialog } from '../components/EmployeeFormDialog';
import { EmployeeQrDialog } from '../components/EmployeeQrDialog';
import type { EmployeeFormValues } from '../validation';
import * as employeesApi from '../api/employeesApi';

const STATUS_FILTERS = [
  { value: 'probation', label: 'Probation' },
  { value: 'active', label: 'Active' },
  { value: 'on_leave', label: 'On leave' },
  { value: 'terminated', label: 'Terminated' },
];

const CARD_ROW_HEIGHT = 200;
const CARD_COLUMN_WIDTH = 280;

export function EmployeesPage() {
  const { user } = useAuth();
  const emp = useEmployees();
  const { options: departments } = useDepartmentOptions();
  const [orientation, setOrientation] = useState<FeedOrientation>('vertical');
  const [qrEmployee, setQrEmployee] = useState<EmployeeDTO | null>(null);

  const crud = useCrudPage<EmployeeDTO, EmployeeFormValues>({
    entityName: 'Employee',
    list: { data: emp.data, page: emp.page, setPage: emp.setPage, refetch: emp.refetch },
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
  const horizontal = orientation === 'horizontal';

  const cardActions = (e: EmployeeDTO): ReactNode => (
    <Stack direction="row" spacing={0.5}>
      <Tooltip title="QR code">
        <IconButton size="small" onClick={() => setQrEmployee(e)} aria-label="show employee QR">
          <QrCode2Icon fontSize="small" />
        </IconButton>
      </Tooltip>
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
    </Stack>
  );

  return (
    <>
      <PageHeader
        title="Employees"
        subtitle={
          horizontal
            ? 'Swipe sideways — more people load as you go'
            : 'Scroll the feed — more people load as you go'
        }
        action={
          canWrite ? (
            <Button variant="contained" startIcon={<AddIcon />} onClick={crud.openCreate}>
              Add employee
            </Button>
          ) : undefined
        }
      />

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{
          mb: 2,
          maxWidth: horizontal ? '100%' : 480,
          mx: horizontal ? 0 : 'auto',
          width: '100%',
        }}
      >
        <SearchBar placeholder="Search employees…" onSearch={emp.setSearch} />
        <TextField
          select
          size="small"
          label="Department"
          value={emp.departmentId}
          onChange={(e) => emp.setDepartmentId(e.target.value)}
          sx={{ minWidth: 160 }}
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
          sx={{ minWidth: 140 }}
          InputLabelProps={{ shrink: true }}
        >
          <MenuItem value="">All statuses</MenuItem>
          {STATUS_FILTERS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Scroll"
          value={orientation}
          onChange={(e) => setOrientation(e.target.value as FeedOrientation)}
          sx={{ minWidth: 140 }}
          InputLabelProps={{ shrink: true }}
        >
          <MenuItem value="vertical">Vertical</MenuItem>
          <MenuItem value="horizontal">Horizontal</MenuItem>
        </TextField>
      </Stack>

      <EmployeeFeed
        rows={emp.data}
        getRowId={(e) => e.id}
        loading={emp.loading}
        loadingMore={emp.loadingMore}
        hasMore={emp.hasMore}
        error={emp.error}
        onRetry={emp.refetch}
        onNearEnd={emp.loadMore}
        resetKey={emp.feedKey}
        orientation={orientation}
        emptyTitle="No employees found"
        emptyDescription={canWrite ? 'Add your first employee to get started.' : undefined}
        maxHeight={720}
        itemSize={horizontal ? CARD_COLUMN_WIDTH : CARD_ROW_HEIGHT}
        columnWidth={CARD_COLUMN_WIDTH}
        renderCard={(e) => <EmployeeCard employee={e} actions={cardActions(e)} />}
      />

      <EmployeeFormDialog
        open={crud.formOpen}
        initial={crud.editing}
        submitting={crud.submitting}
        onClose={crud.closeForm}
        onSubmit={crud.submit}
      />

      <EmployeeQrDialog
        employee={qrEmployee}
        open={Boolean(qrEmployee)}
        onClose={() => setQrEmployee(null)}
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
