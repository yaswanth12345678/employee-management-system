import type { RoleName } from '@ems/shared';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../config/routes';

/**
 * Route guard that also checks the user's role. Non-permitted users are redirected to the
 * dashboard (rather than mounting a page that would only 403). Mirrors the backend authorize().
 */
export function RoleRoute({ allow }: { allow: RoleName[] }) {
  const { user } = useAuth();
  if (!user || !allow.includes(user.role)) {
    return <Navigate to={ROUTES.dashboard} replace />;
  }
  return <Outlet />;
}
