import { useCallback, useState } from 'react';
import type { PriorityLevel, TaskDTO, TaskStatus } from '@ems/shared';
import { usePaginatedList } from '../../../hooks/usePaginatedList';
import * as tasksApi from '../api/tasksApi';

export function useTasks() {
  const [search, setSearch] = useState('');
  const [projectId, setProjectId] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');

  const fetchPage = useCallback(
    (page: number, limit: number) =>
      tasksApi
        .list({
          page,
          limit,
          search: search || undefined,
          projectId: projectId || undefined,
          status: (status || undefined) as TaskStatus | undefined,
          priority: (priority || undefined) as PriorityLevel | undefined,
        })
        .then((res) => ({ data: res.data, total: res.meta.pagination.total })),
    [search, projectId, status, priority],
  );

  const list = usePaginatedList<TaskDTO>(fetchPage);
  const { resetPage } = list;
  const changeSearch = useCallback((v: string) => { setSearch(v); resetPage(); }, [resetPage]);
  const changeProject = useCallback((v: string) => { setProjectId(v); resetPage(); }, [resetPage]);
  const changeStatus = useCallback((v: string) => { setStatus(v); resetPage(); }, [resetPage]);
  const changePriority = useCallback((v: string) => { setPriority(v); resetPage(); }, [resetPage]);

  return {
    ...list,
    projectId,
    status,
    priority,
    setSearch: changeSearch,
    setProjectId: changeProject,
    setStatus: changeStatus,
    setPriority: changePriority,
  };
}
