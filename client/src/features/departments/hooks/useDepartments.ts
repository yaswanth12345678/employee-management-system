import { useCallback, useState } from 'react';
import type { DepartmentDTO } from '@ems/shared';
import { usePaginatedList } from '../../../hooks/usePaginatedList';
import * as departmentsApi from '../api/departmentsApi';

export function useDepartments() {
  const [search, setSearch] = useState('');

  const fetchPage = useCallback(
    (page: number, limit: number) =>
      departmentsApi
        .list({ page, limit, search: search || undefined })
        .then((res) => ({ data: res.data, total: res.meta.pagination.total })),
    [search],
  );

  const list = usePaginatedList<DepartmentDTO>(fetchPage);
  const { resetPage } = list;
  const changeSearch = useCallback(
    (value: string) => {
      setSearch(value);
      resetPage();
    },
    [resetPage],
  );

  return { ...list, setSearch: changeSearch };
}
