import { Box, Paper, Stack, Typography } from '@mui/material';
import { PageHeader } from '../../../components/layout/PageHeader';
import { PageLoader } from '../../../components/feedback/PageLoader';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { useAuth } from '../../../contexts/AuthContext';
import { StatCard } from '../components/StatCard';
import { useDashboard } from '../hooks/useDashboard';

export function DashboardPage() {
  const { user } = useAuth();
  const { summary, error, loading, refetch } = useDashboard();

  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (loading || !summary) return <PageLoader />;

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back, ${user?.employee?.firstName ?? 'there'}`}
      />

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
        }}
      >
        <StatCard label="My open tasks" value={summary.myOpenTasks} />
        <StatCard label="My pending leave" value={summary.myPendingLeave} />
        <StatCard
          label="Today's attendance"
          value={
            summary.todayAttendanceStatus
              ? summary.todayAttendanceStatus.replace('_', ' ')
              : 'Not checked in'
          }
        />
        {summary.teamStats && <StatCard label="Headcount" value={summary.teamStats.headcount} />}
        {summary.teamStats && (
          <StatCard label="On leave today" value={summary.teamStats.onLeaveToday} />
        )}
        {summary.projectStats && (
          <StatCard label="Active projects" value={summary.projectStats.active} />
        )}
        {summary.projectStats && (
          <StatCard label="Overdue projects" value={summary.projectStats.overdue} />
        )}
      </Box>

      <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 4, mb: 1 }}>
        Recent notifications
      </Typography>
      {summary.recentNotifications.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No recent notifications.
        </Typography>
      ) : (
        <Stack spacing={1}>
          {summary.recentNotifications.map((n) => (
            <Paper key={n.id} variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" fontWeight={n.isRead ? 500 : 700}>
                {n.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {n.message}
              </Typography>
            </Paper>
          ))}
        </Stack>
      )}
    </>
  );
}
