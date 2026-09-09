import { useCallback, useEffect, useRef, useState } from 'react';
import type { EmployeeDTO, EmploymentStatus } from '@ems/shared';
import type { NormalizedError } from '../../../lib/http';
import * as employeesApi from '../api/employeesApi';

const PAGE_SIZE = 12;

/**
 * Instagram-style employees feed: loads the first page, then appends more as
 * the UI calls `loadMore` near the bottom. Filter changes reset the feed.
 */
export function useEmployees() {
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [status, setStatus] = useState('');

  const [data, setData] = useState<EmployeeDTO[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestIdRef = useRef(0);
  const pageRef = useRef(1);
  const loadingMoreRef = useRef(false);

  const filtersKey = `${search}|${departmentId}|${status}`;

  const fetchPage = useCallback(
    async (pageNum: number) => {
      const res = await employeesApi.list({
        page: pageNum,
        limit: PAGE_SIZE,
        search: search || undefined,
        departmentId: departmentId || undefined,
        status: (status || undefined) as EmploymentStatus | undefined,
      });
      return { rows: res.data, total: res.meta.pagination.total };
    },
    [search, departmentId, status],
  );

  // Reset + load first page whenever filters change.
  useEffect(() => {
    const requestId = ++requestIdRef.current;
    pageRef.current = 1;
    setPage(1);
    setData([]);
    setLoading(true);
    setError(null);
    setLoadingMore(false);
    loadingMoreRef.current = false;

    void fetchPage(1)
      .then(({ rows, total: nextTotal }) => {
        if (requestId !== requestIdRef.current) return;
        setData(rows);
        setTotal(nextTotal);
        setLoading(false);
      })
      .catch((err) => {
        if (requestId !== requestIdRef.current) return;
        setError((err as NormalizedError).message);
        setLoading(false);
      });
  }, [filtersKey, fetchPage]);

  const hasMore = data.length < total;

  const loadMore = useCallback(() => {
    if (!hasMore || loading || loadingMoreRef.current) return;

    const nextPage = pageRef.current + 1;
    const requestId = ++requestIdRef.current;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    setError(null);

    void fetchPage(nextPage)
      .then(({ rows, total: nextTotal }) => {
        if (requestId !== requestIdRef.current) return;
        pageRef.current = nextPage;
        setPage(nextPage);
        setTotal(nextTotal);
        setData((prev) => {
          const seen = new Set(prev.map((row) => row.id));
          const appended = rows.filter((row) => !seen.has(row.id));
          return appended.length > 0 ? [...prev, ...appended] : prev;
        });
      })
      .catch((err) => {
        if (requestId !== requestIdRef.current) return;
        setError((err as NormalizedError).message);
      })
      .finally(() => {
        if (requestId !== requestIdRef.current) return;
        loadingMoreRef.current = false;
        setLoadingMore(false);
      });
  }, [fetchPage, hasMore, loading]);

  const refetch = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    pageRef.current = 1;
    setPage(1);
    setLoading(true);
    setError(null);
    setLoadingMore(false);
    loadingMoreRef.current = false;

    try {
      const { rows, total: nextTotal } = await fetchPage(1);
      if (requestId !== requestIdRef.current) return;
      setData(rows);
      setTotal(nextTotal);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError((err as NormalizedError).message);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [fetchPage]);

  const changeSearch = useCallback((v: string) => setSearch(v), []);
  const changeDepartment = useCallback((v: string) => setDepartmentId(v), []);
  const changeStatus = useCallback((v: string) => setStatus(v), []);

  return {
    data,
    total,
    page,
    // Kept for useCrudPage delete edge-case; feed always resets via refetch.
    setPage: (_next: number) => {
      void refetch();
    },
    limit: PAGE_SIZE,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    refetch,
    feedKey: filtersKey,
    departmentId,
    status,
    setSearch: changeSearch,
    setDepartmentId: changeDepartment,
    setStatus: changeStatus,
  };
}
