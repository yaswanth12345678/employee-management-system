import { Badge, IconButton, Tooltip } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../config/routes';
import { useNotificationsBadge } from './NotificationsBadgeProvider';

/** Topbar bell with an unread-count badge; navigates to the notifications feed. */
export function NotificationsBell() {
  const { count } = useNotificationsBadge();
  const navigate = useNavigate();

  return (
    <Tooltip title="Notifications">
      <IconButton color="inherit" onClick={() => navigate(ROUTES.notifications)}>
        <Badge badgeContent={count} color="error" max={99}>
          <NotificationsIcon />
        </Badge>
      </IconButton>
    </Tooltip>
  );
}
