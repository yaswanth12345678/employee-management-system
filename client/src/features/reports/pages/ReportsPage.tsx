import type { ReactNode } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { PageHeader } from '../../../components/layout/PageHeader';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { PageLoader } from '../../../components/feedback/PageLoader';
import { useReports } from '../hooks/useReports';
import { BarList } from '../components/BarList';

function ReportCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
        {title}
      </Typography>
      {children}
    </Paper>
  );
}

export function ReportsPage() {
  const reports = useReports();

  return (
    <>
      <PageHeader title="Reports" subtitle="Organization-wide insights" />

      {reports.loading ? (
        <PageLoader />
      ) : reports.error ? (
        <ErrorState message={reports.error} onRetry={reports.refetch} />
      ) : (
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          }}
        >
          <ReportCard title={`Headcount by department (total ${reports.headcount?.total ?? 0})`}>
            <BarList items={reports.headcount?.byDepartment ?? []} />
          </ReportCard>
          <ReportCard title="Employees by status">
            <BarList items={reports.headcount?.byStatus ?? []} />
          </ReportCard>
          <ReportCard title="Projects by status">
            <BarList items={reports.projectStatus?.byStatus ?? []} />
          </ReportCard>
          <ReportCard title="Leave by status">
            <BarList items={reports.leave?.byStatus ?? []} />
          </ReportCard>
          <ReportCard title="Leave by type">
            <BarList items={reports.leave?.byType ?? []} />
          </ReportCard>
          <ReportCard title="Attendance by status">
            <BarList items={reports.attendance?.byStatus ?? []} />
          </ReportCard>
        </Box>
      )}
    </>
  );
}
