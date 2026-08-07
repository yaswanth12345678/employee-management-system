import { useCallback, useEffect, useMemo, useState } from 'react';
import type { NotificationDTO } from '@ems/shared';
import type { NormalizedError } from '../../../lib/http';
import * as notificationsApi from '../api/notificationsApi';

interface NotificationsState {
  data: NotificationDTO[];
  loading: boolean;
  error: string | null;
}

export function useNotifications() {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [state, setState] = useState<NotificationsState>({ data: [], loading: true, error: null });

  const fetchFeed = useCallback(
    async (isActive?: () => boolean) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const res = await notificationsApi.list(1, 50, unreadOnly);
        if (!isActive || isActive()) {
          setState({ data: res.data, loading: false, error: null });
        }
      } catch (err) {
        if (!isActive || isActive()) {
          setState((prev) => ({ ...prev, loading: false, error: (err as NormalizedError).message }));
        }
      }
    },
    [unreadOnly],
  );

  useEffect(() => {
    let active = true;
    void fetchFeed(() => active);
    return () => {
      active = false;
    };
  }, [fetchFeed]);

  return useMemo(
    () => ({ ...state, unreadOnly, setUnreadOnly, refetch: fetchFeed }),
    [state, unreadOnly, fetchFeed],
  );
}
