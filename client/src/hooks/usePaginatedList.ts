import { useCallback, useEffect, useState } from 'react';
import type { NormalizedError } from '../lib/http';

interface Page<T> {
  data: T[];
  total: number;
}

interface ListState<T> {
  data: T[];
  total: number;
  loading: boolean;
  error: string | null;
}

/**
 * The pagination + fetch plumbing shared by every list screen's data hook: page/limit state, the
 * loading/error lifecycle, and a stale-response guard (a slow older request can't overwrite the
 * data for the current page/filters). A feature hook supplies a `fetchPage` closure — memoized over
 * its own filters — that returns one page of rows plus the total; when a filter changes, that
 * closure changes (triggering a re-fetch) and the hook should call `resetPage()` to restart at 1.
 */
interface UsePaginatedListOptions {
  initialLimit?: number;
}

export function usePaginatedList<T>(
  fetchPage: (page: number, limit: number) => Promise<Page<T>>,
  options?: UsePaginatedListOptions,
) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(options?.initialLimit ?? 10);
  const [state, setState] = useState<ListState<T>>({ data: [], total: 0, loading: true, error: null });

  const refetch = useCallback(
    async (isActive?: () => boolean) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const { data, total } = await fetchPage(page, limit);
        if (!isActive || isActive()) setState({ data, total, loading: false, error: null });
      } catch (err) {
        if (!isActive || isActive()) {
          setState((prev) => ({ ...prev, loading: false, error: (err as NormalizedError).message }));
        }
      }
    },
    [page, limit, fetchPage],
  );

  useEffect(() => {
    let active = true;
    void refetch(() => active);
    return () => {
      active = false;
    };
  }, [refetch]);

  // Changing the page size or a filter starts a fresh result set from page 1.
  const changeLimit = useCallback((value: number) => {
    setLimit(value);
    setPage(1);
  }, []);
  const resetPage = useCallback(() => setPage(1), []);

  return { ...state, page, limit, setPage, setLimit: changeLimit, resetPage, refetch };
}
