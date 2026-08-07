import { useState, type ReactNode } from 'react';
import { Link as RouterLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Avatar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ApartmentIcon from '@mui/icons-material/Apartment';
import PeopleIcon from '@mui/icons-material/People';
import FolderIcon from '@mui/icons-material/Folder';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import type { RoleName } from '@ems/shared';
import { ROUTES } from '../../config/routes';
import { useAuth } from '../../contexts/AuthContext';
import { NotificationsBell } from '../../features/notifications';

const DRAWER_WIDTH = 240;

interface NavItem {
  label: string;
  to: string;
  icon: ReactNode;
  roles?: RoleName[]; // when set, only these roles see the item
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: ROUTES.dashboard, icon: <DashboardIcon /> },
  { label: 'Departments', to: ROUTES.departments, icon: <ApartmentIcon /> },
  { label: 'Employees', to: ROUTES.employees, icon: <PeopleIcon /> },
  { label: 'Projects', to: ROUTES.projects, icon: <FolderIcon /> },
  { label: 'Tasks', to: ROUTES.tasks, icon: <TaskAltIcon /> },
  { label: 'Leave', to: ROUTES.leave, icon: <EventBusyIcon /> },
  { label: 'Attendance', to: ROUTES.attendance, icon: <AccessTimeIcon /> },
  { label: 'Reports', to: ROUTES.reports, icon: <AssessmentIcon />, roles: ['admin', 'hr', 'manager'] },
  { label: 'Settings', to: ROUTES.settings, icon: <SettingsIcon /> },
];

/**
 * The authenticated app frame: a responsive sidebar (permanent on desktop, temporary drawer
 * on mobile) + a top bar with the user avatar and logout. `<Outlet/>` renders the active page.
 * A single layout shared by every protected route keeps navigation consistent app-wide.
 */
export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const displayName = user?.employee?.firstName ?? user?.email ?? 'Guest';

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.login);
  };

  const drawerContent = (
    <div>
      <Toolbar>
        <Typography variant="h6" fontWeight={800} color="primary">
          EMS
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {NAV_ITEMS.filter((item) => !item.roles || (user ? item.roles.includes(user.role) : false)).map((item) => (
          <ListItemButton
            key={item.to}
            component={RouterLink}
            to={item.to}
            selected={location.pathname.startsWith(item.to)}
            onClick={() => setMobileOpen(false)}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{ width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` }, ml: { sm: `${DRAWER_WIDTH}px` } }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen((prev) => !prev)}
            sx={{ mr: 2, display: { sm: 'none' } }}
            aria-label="open navigation"
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
            Employee &amp; Project Management
          </Typography>
          <NotificationsBell />
          <Tooltip title={`${displayName} — profile`}>
            <IconButton onClick={() => navigate(ROUTES.profile)} sx={{ p: 0.5 }} aria-label="profile">
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                {displayName.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
          </Tooltip>
          <Tooltip title="Log out">
            <IconButton color="inherit" onClick={handleLogout} sx={{ ml: 1 }} aria-label="log out">
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}>
        {/* Mobile: temporary drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
          }}
        >
          {drawerContent}
        </Drawer>
        {/* Desktop: permanent drawer */}
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` } }}>
        <Toolbar /> {/* spacer to offset the fixed AppBar */}
        <Outlet />
      </Box>
    </Box>
  );
}
