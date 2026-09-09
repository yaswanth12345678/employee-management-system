/**
 * Route path constants. Referencing `ROUTES.dashboard` instead of the string '/dashboard'
 * everywhere means a path change happens in ONE place and TypeScript catches typos.
 */
export const ROUTES = {
  login: '/login',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  dashboard: '/dashboard',
  departments: '/departments',
  employees: '/employees',
  employeeQr: '/employees/qr/:id',
  projects: '/projects',
  tasks: '/tasks',
  leave: '/leave',
  attendance: '/attendance',
  notifications: '/notifications',
  reports: '/reports',
  profile: '/profile',
  settings: '/settings',
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
