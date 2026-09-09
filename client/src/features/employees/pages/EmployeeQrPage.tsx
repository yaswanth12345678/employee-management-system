import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import type { EmployeeDTO } from '@ems/shared';
import { PageHeader } from '../../../components/layout/PageHeader';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { PageLoader } from '../../../components/feedback/PageLoader';
import type { NormalizedError } from '../../../lib/http';
import { StatusChip } from '../components/StatusChip';
import * as employeesApi from '../api/employeesApi';

/** Destination page for an employee QR scan — shows that employee's profile card. */
export function EmployeeQrPage() {
  const { id } = useParams<{ id: string }>();
  const [employee, setEmployee] = useState<EmployeeDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    if (!id) {
      setError('Missing employee id');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    void employeesApi
      .getById(id)
      .then((data) => {
        setEmployee(data);
        setLoading(false);
      })
      .catch((err) => {
        setError((err as NormalizedError).message ?? 'Employee not found');
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when route id changes
  }, [id]);

  return (
    <>
      <PageHeader title="Employee card" subtitle="Scanned from QR code" />

      {loading && <PageLoader />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && employee && (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Card variant="outlined" sx={{ width: '100%', maxWidth: 480 }}>
            <CardContent>
              <Stack spacing={2} alignItems="center" sx={{ textAlign: 'center' }}>
                <Avatar src={employee.avatarUrl} sx={{ width: 80, height: 80 }}>
                  {employee.firstName.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight={700}>
                    {employee.firstName} {employee.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {employee.employeeCode}
                  </Typography>
                </Box>
                <StatusChip status={employee.status} />
              </Stack>

              <Divider sx={{ my: 2.5 }} />

              <Stack spacing={1.5}>
                <InfoRow label="Email" value={employee.email} />
                <InfoRow label="Role" value={employee.role} />
                <InfoRow label="Job title" value={employee.jobTitle || '—'} />
                <InfoRow label="Department" value={employee.department?.name ?? '—'} />
                <InfoRow label="Phone" value={employee.phone || '—'} />
                <InfoRow label="Hire date" value={employee.hireDate} />
                <InfoRow
                  label="Manager"
                  value={
                    employee.manager
                      ? `${employee.manager.firstName} ${employee.manager.lastName}`
                      : '—'
                  }
                />
              </Stack>
            </CardContent>
          </Card>
        </Box>
      )}
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" justifyContent="space-between" spacing={2}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600} textAlign="right">
        {value}
      </Typography>
    </Stack>
  );
}
