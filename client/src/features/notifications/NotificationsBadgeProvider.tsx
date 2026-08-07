import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { onRealtime } from '../../lib/realtime/socket';
import * as notificationsApi from './api/notificationsApi';

/**
 * Shared unread-count for the whole app, so the topbar bell and the notifications page use ONE
 * source of truth. Mutations (mark-read / dismiss / mark-all) call `refresh()` for an instant
 * badge update instead of waiting for the poll.
 */
interface BadgeValue {
  count: number;
  refresh: () => void;
}

const BadgeContext = createContext<BadgeValue | undefined>(undefined);

export function NotificationsBadgeProvider({
  children,
  pollMs = 45000,
}: {
  children: ReactNode;
  pollMs?: number;
}) {
  const { isAuthenticated } = useAuth();
  const [count, setCount] = useState(0);

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setCount(0);
      return;
    }
    try {
      setCount(await notificationsApi.unreadCount());
    } catch {
      /* best-effort badge */
    }
  }, [isAuthenticated]);

  const refresh = useCallback(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!isAuthenticated) {
      setCount(0);
      return;
    }
    void load();
    const timer = setInterval(load, pollMs);
    // Live push: bump the badge immediately when a notification arrives over the socket.
    const off = onRealtime((message) => {
      if (message.type === 'notification') setCount((current) => current + 1);
    });
    return () => {
      clearInterval(timer);
      off();
    };
  }, [isAuthenticated, load, pollMs]);

  const value = useMemo(() => ({ count, refresh }), [count, refresh]);
  return <BadgeContext.Provider value={value}>{children}</BadgeContext.Provider>;
}

export function useNotificationsBadge(): BadgeValue {
  const ctx = useContext(BadgeContext);
  if (!ctx) {
    throw new Error('useNotificationsBadge must be used within a NotificationsBadgeProvider');
  }
  return ctx;
}
