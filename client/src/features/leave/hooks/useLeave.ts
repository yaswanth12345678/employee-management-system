import { useCallback, useState } from 'react';
import type { LeaveRequestDTO, LeaveStatus, LeaveType } from '@ems/shared';
import { usePaginatedList } from '../../../hooks/usePaginatedList';
import * as leaveApi from '../api/leaveApi';

export function useLeave() {
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');

  const fetchPage = useCallback(
    (page: number, limit: number) =>
      leaveApi
        .list({
          page,
          limit,
          status: (status || undefined) as LeaveStatus | undefined,
          type: (type || undefined) as LeaveType | undefined,
        })
        .then((res) => ({ data: res.data, total: res.meta.pagination.total })),
    [status, type],
  );

  const list = usePaginatedList<LeaveRequestDTO>(fetchPage);
  const { resetPage } = list;
  const changeStatus = useCallback((v: string) => { setStatus(v); resetPage(); }, [resetPage]);
  const changeType = useCallback((v: string) => { setType(v); resetPage(); }, [resetPage]);

  return { ...list, status, type, setStatus: changeStatus, setType: changeType };
}
