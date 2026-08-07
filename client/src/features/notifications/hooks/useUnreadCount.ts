import { useCallback, useEffect, useState } from 'react';
import * as notificationsApi from '../api/notificationsApi';

/** Polls the unread-notification count for the topbar bell badge. */
export function useUnreadCount(pollMs = 45000) {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      setCount(await notificationsApi.unreadCount());
    } catch {
      /* ignore — badge is best-effort */
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = setInterval(refresh, pollMs);
    return () => clearInterval(timer);
  }, [refresh, pollMs]);

  return { count, refresh };
}
