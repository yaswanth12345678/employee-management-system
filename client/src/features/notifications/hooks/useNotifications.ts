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
  const [mutating, setMutating] = useState(false);

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
          setState((prev) => ({
            ...prev,
            loading: false,
            error: (err as NormalizedError).message,
          }));
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

  const markRead = useCallback(
    async (id: string) => {
      setMutating(true);
      try {
        await notificationsApi.markRead(id);
        await fetchFeed();
      } finally {
        setMutating(false);
      }
    },
    [fetchFeed],
  );

  const remove = useCallback(
    async (id: string) => {
      setMutating(true);
      try {
        await notificationsApi.remove(id);
        await fetchFeed();
      } finally {
        setMutating(false);
      }
    },
    [fetchFeed],
  );

  const markAllRead = useCallback(async () => {
    setMutating(true);
    try {
      await notificationsApi.markAllRead();
      await fetchFeed();
    } finally {
      setMutating(false);
    }
  }, [fetchFeed]);

  return useMemo(
    () => ({
      ...state,
      unreadOnly,
      setUnreadOnly,
      refetch: fetchFeed,
      markRead,
      remove,
      markAllRead,
      mutating,
    }),
    [state, unreadOnly, fetchFeed, markRead, remove, markAllRead, mutating],
  );
}
