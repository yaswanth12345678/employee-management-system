import { useEffect, type ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { connectRealtime, disconnectRealtime } from './socket';

/**
 * Opens the realtime WebSocket while the user is authenticated and closes it on logout.
 * Rendered inside AuthProvider so it can react to auth status.
 */
export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { status } = useAuth();

  useEffect(() => {
    if (status !== 'authenticated') return undefined;
    connectRealtime();
    return () => disconnectRealtime();
  }, [status]);

  return <>{children}</>;
}
