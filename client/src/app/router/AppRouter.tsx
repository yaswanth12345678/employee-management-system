import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';
import { NotFoundPage } from './NotFoundPage';
import { PageLoader } from '../../components/feedback/PageLoader';
import { ROUTES } from '../../config/routes';

/**
 * Route table with CODE SPLITTING.
 *
 * Each page is `lazy()`-imported, so Vite emits it as a SEPARATE JS chunk that only downloads
 * when the user navigates there. The login screen no longer ships the entire app's code. The
 * <Suspense> fallback (a spinner) shows while a chunk is in flight.
 */
const LoginPage = lazy(() =>
  import('../../features/auth').then((m) => ({ default: m.LoginPage })),
);
const ForgotPasswordPage = lazy(() =>
  import('../../features/auth').then((m) => ({ default: m.ForgotPasswordPage })),
);
const ResetPasswordPage = lazy(() =>
  import('../../features/auth').then((m) => ({ default: m.ResetPasswordPage })),
);
const DashboardPage = lazy(() =>
  import('../../features/dashboard').then((m) => ({ default: m.DashboardPage })),
);
const DepartmentsPage = lazy(() =>
  import('../../features/departments').then((m) => ({ default: m.DepartmentsPage })),
);
const EmployeesPage = lazy(() =>
  import('../../features/employees').then((m) => ({ default: m.EmployeesPage })),
);
const ProjectsPage = lazy(() =>
  import('../../features/projects').then((m) => ({ default: m.ProjectsPage })),
);
const TasksPage = lazy(() =>
  import('../../features/tasks').then((m) => ({ default: m.TasksPage })),
);
const LeavePage = lazy(() =>
  import('../../features/leave').then((m) => ({ default: m.LeavePage })),
);
const AttendancePage = lazy(() =>
  import('../../features/attendance').then((m) => ({ default: m.AttendancePage })),
);
const NotificationsPage = lazy(() =>
  import('../../features/notifications').then((m) => ({ default: m.NotificationsPage })),
);
const ReportsPage = lazy(() =>
  import('../../features/reports').then((m) => ({ default: m.ReportsPage })),
);
const ProfilePage = lazy(() =>
  import('../../features/profile').then((m) => ({ default: m.ProfilePage })),
);
const SettingsPage = lazy(() =>
  import('../../features/settings').then((m) => ({ default: m.SettingsPage })),
);

export function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public routes */}
        <Route element={<AuthLayout />}>
          <Route path={ROUTES.login} element={<LoginPage />} />
          <Route path={ROUTES.forgotPassword} element={<ForgotPasswordPage />} />
          <Route path={ROUTES.resetPassword} element={<ResetPasswordPage />} />
        </Route>

        {/* Protected routes: guard first, then the shared app frame */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path={ROUTES.dashboard} element={<DashboardPage />} />
            <Route path={ROUTES.departments} element={<DepartmentsPage />} />
            <Route path={ROUTES.employees} element={<EmployeesPage />} />
            <Route path={ROUTES.projects} element={<ProjectsPage />} />
            <Route path={ROUTES.tasks} element={<TasksPage />} />
            <Route path={ROUTES.leave} element={<LeavePage />} />
            <Route path={ROUTES.attendance} element={<AttendancePage />} />
            <Route path={ROUTES.notifications} element={<NotificationsPage />} />
            <Route element={<RoleRoute allow={['admin', 'hr', 'manager']} />}>
              <Route path={ROUTES.reports} element={<ReportsPage />} />
            </Route>
            <Route path={ROUTES.profile} element={<ProfilePage />} />
            <Route path={ROUTES.settings} element={<SettingsPage />} />
          </Route>
        </Route>

        {/* Redirects & catch-all */}
        <Route path="/" element={<Navigate to={ROUTES.dashboard} replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
