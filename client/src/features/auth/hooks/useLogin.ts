import { useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { NormalizedError } from '../../../lib/http';
import { useAuth } from '../../../contexts/AuthContext';
import { ROUTES } from '../../../config/routes';
import type { LoginFormValues } from '../validation';

interface LocationState {
  from?: { pathname?: string };
}

/**
 * Encapsulates the "submit login" side effects so the page component stays presentational:
 * call the auth context, translate a failure into a human message, and on success send the
 * user to wherever they were originally headed (or the dashboard).
 *
 * (Form field state itself is owned by react-hook-form in the page — this hook only owns the
 * submit outcome.)
 */
export function useLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);

  const redirectTo = (location.state as LocationState | null)?.from?.pathname ?? ROUTES.dashboard;

  const submit = useCallback(
    async (values: LoginFormValues) => {
      setError(null);
      try {
        await login(values.email, values.password);
        navigate(redirectTo, { replace: true });
      } catch (err) {
        setError((err as NormalizedError).message ?? 'Login failed. Please try again.');
      }
    },
    [login, navigate, redirectTo],
  );

  return { submit, error };
}
