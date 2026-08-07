import { useCallback, useState } from 'react';
import type { PriorityLevel, ProjectDTO, ProjectStatus } from '@ems/shared';
import { usePaginatedList } from '../../../hooks/usePaginatedList';
import * as projectsApi from '../api/projectsApi';

export function useProjects() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');

  const fetchPage = useCallback(
    (page: number, limit: number) =>
      projectsApi
        .list({
          page,
          limit,
          search: search || undefined,
          status: (status || undefined) as ProjectStatus | undefined,
          priority: (priority || undefined) as PriorityLevel | undefined,
        })
        .then((res) => ({ data: res.data, total: res.meta.pagination.total })),
    [search, status, priority],
  );

  const list = usePaginatedList<ProjectDTO>(fetchPage);
  const { resetPage } = list;
  const changeSearch = useCallback((v: string) => { setSearch(v); resetPage(); }, [resetPage]);
  const changeStatus = useCallback((v: string) => { setStatus(v); resetPage(); }, [resetPage]);
  const changePriority = useCallback((v: string) => { setPriority(v); resetPage(); }, [resetPage]);

  return {
    ...list,
    status,
    priority,
    setSearch: changeSearch,
    setStatus: changeStatus,
    setPriority: changePriority,
  };
}
