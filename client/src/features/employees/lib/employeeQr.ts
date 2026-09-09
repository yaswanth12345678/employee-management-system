import { ROUTES } from '../../../config/routes';

/** Build the absolute scan URL encoded in an employee's unique QR code. */
export function employeeQrPath(employeeId: string): string {
  return ROUTES.employeeQr.replace(':id', employeeId);
}

export function employeeQrUrl(employeeId: string): string {
  const path = employeeQrPath(employeeId);
  if (typeof window === 'undefined') return path;
  return `${window.location.origin}${path}`;
}
