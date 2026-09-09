import type { ReactNode } from 'react';
import { Avatar, Box, Card, CardContent, Stack, Typography } from '@mui/material';
import type { EmployeeDTO } from '@ems/shared';
import { StatusChip } from './StatusChip';

interface EmployeeCardProps {
  employee: EmployeeDTO;
  actions?: ReactNode;
}

/** Compact employee summary card for list/grid layouts. */
export function EmployeeCard({ employee, actions }: EmployeeCardProps) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, height: '100%' }}>
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          <Avatar src={employee.avatarUrl} sx={{ width: 44, height: 44 }}>
            {employee.firstName.charAt(0)}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="subtitle2" fontWeight={700} noWrap>
              {employee.firstName} {employee.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" noWrap>
              {employee.employeeCode}
            </Typography>
          </Box>
          {actions}
        </Stack>

        <Stack spacing={0.5} sx={{ flex: 1 }}>
          <Typography variant="body2" color="text.secondary" noWrap>
            {employee.email}
          </Typography>
          <Typography variant="body2" noWrap>
            {employee.jobTitle || employee.role}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {employee.department?.name ?? 'No department'}
          </Typography>
        </Stack>

        <Box>
          <StatusChip status={employee.status} />
        </Box>
      </CardContent>
    </Card>
  );
}
