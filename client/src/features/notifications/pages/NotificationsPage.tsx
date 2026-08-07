import { useEffect } from 'react';
import { Box, Chip, IconButton, Paper, Stack, Tooltip, Typography } from '@mui/material';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import CheckIcon from '@mui/icons-material/Check';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import type { NotificationDTO } from '@ems/shared';
import type { NormalizedError } from '../../../lib/http';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { PageLoader } from '../../../components/feedback/PageLoader';
import { useSnackbar } from '../../../contexts/SnackbarContext';
import { useNotifications } from '../hooks/useNotifications';
import { useNotificationsBadge } from '../NotificationsBadgeProvider';
import { onRealtime } from '../../../lib/realtime/socket';
import * as notificationsApi from '../api/notificationsApi';

function NotificationItem({
  item,
  onRead,
  onDelete,
}: {
  item: NotificationDTO;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{ p: 2, bgcolor: item.isRead ? 'transparent' : 'action.hover' }}
    >
      <Stack direction="row" spacing={2} alignItems="flex-start" justifyContent="space-between">
        <Box>
          <Typography variant="subtitle2" fontWeight={item.isRead ? 500 : 700}>
            {item.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {item.message}
          </Typography>
          <Typography variant="caption" color="text.disabled">
            {new Date(item.createdAt).toLocaleString()}
          </Typography>
        </Box>
        <Stack direction="row" spacing={0.5}>
          {!item.isRead && (
            <Tooltip title="Mark as read">
              <IconButton size="small" onClick={() => onRead(item.id)}>
                <CheckIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Dismiss">
            <IconButton size="small" color="error" onClick={() => onDelete(item.id)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>
    </Paper>
  );
}

export function NotificationsPage() {
  const { notify } = useSnackbar();
  const feed = useNotifications();
  const badge = useNotificationsBadge();

  // Live: refresh the feed when a new notification arrives over the socket.
  useEffect(() => {
    const off = onRealtime((message) => {
      if (message.type === 'notification') void feed.refetch();
    });
    return off;
  }, [feed.refetch]);

  const handleRead = async (id: string) => {
    try {
      await notificationsApi.markRead(id);
      await feed.refetch();
      badge.refresh();
    } catch (err) {
      notify((err as NormalizedError).message, 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationsApi.remove(id);
      await feed.refetch();
      badge.refresh();
    } catch (err) {
      notify((err as NormalizedError).message, 'error');
    }
  };

  const handleMarkAll = async () => {
    try {
      await notificationsApi.markAllRead();
      notify('All notifications marked as read', 'success');
      await feed.refetch();
      badge.refresh();
    } catch (err) {
      notify((err as NormalizedError).message, 'error');
    }
  };

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Stay up to date with what's happening"
        action={
          <Button variant="outlined" startIcon={<DoneAllIcon />} onClick={handleMarkAll}>
            Mark all read
          </Button>
        }
      />

      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <Chip
          label="All"
          color={!feed.unreadOnly ? 'primary' : 'default'}
          variant={!feed.unreadOnly ? 'filled' : 'outlined'}
          onClick={() => feed.setUnreadOnly(false)}
        />
        <Chip
          label="Unread"
          color={feed.unreadOnly ? 'primary' : 'default'}
          variant={feed.unreadOnly ? 'filled' : 'outlined'}
          onClick={() => feed.setUnreadOnly(true)}
        />
      </Stack>

      {feed.loading ? (
        <PageLoader />
      ) : feed.error ? (
        <ErrorState message={feed.error} onRetry={feed.refetch} />
      ) : feed.data.length === 0 ? (
        <EmptyState title="You're all caught up" description="No notifications to show." />
      ) : (
        <Stack spacing={1.5}>
          {feed.data.map((item) => (
            <NotificationItem key={item.id} item={item} onRead={handleRead} onDelete={handleDelete} />
          ))}
        </Stack>
      )}
    </>
  );
}
