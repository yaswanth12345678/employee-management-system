import { useCallback, useState } from 'react';
import type { EmployeeDTO, EmploymentStatus } from '@ems/shared';
import { usePaginatedList } from '../../../hooks/usePaginatedList';
import * as employeesApi from '../api/employeesApi';

export function useEmployees() {
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [status, setStatus] = useState('');

  const fetchPage = useCallback(
    (page: number, limit: number) =>
      employeesApi
        .list({
          page,
          limit,
          search: search || undefined,
          departmentId: departmentId || undefined,
          status: (status || undefined) as EmploymentStatus | undefined,
        })
        .then((res) => ({ data: res.data, total: res.meta.pagination.total })),
    [search, departmentId, status],
  );

  const list = usePaginatedList<EmployeeDTO>(fetchPage);
  const { resetPage } = list;
  const changeSearch = useCallback((v: string) => { setSearch(v); resetPage(); }, [resetPage]);
  const changeDepartment = useCallback((v: string) => { setDepartmentId(v); resetPage(); }, [resetPage]);
  const changeStatus = useCallback((v: string) => { setStatus(v); resetPage(); }, [resetPage]);

  return {
    ...list,
    departmentId,
    status,
    setSearch: changeSearch,
    setDepartmentId: changeDepartment,
    setStatus: changeStatus,
  };
}
