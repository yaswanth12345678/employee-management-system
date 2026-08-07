import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { PageLoader } from '../../components/feedback/PageLoader';
import { ROUTES } from '../../config/routes';

/**
 * Route guard with three states, driven by the auth machine:
 *   • initializing   → we're still bootstrapping the session; show a loader (NOT the login
 *                       page — otherwise a logged-in user sees a login flash on every refresh).
 *   • unauthenticated → redirect to /login, remembering where they were headed.
 *   • authenticated   → render the protected content.
 */
export function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'initializing') {
    return <PageLoader />;
  }

  if (status === 'unauthenticated') {
    return <Navigate to={ROUTES.login} replace state={{ from: location }} />;
  }

  return <Outlet />;
}
