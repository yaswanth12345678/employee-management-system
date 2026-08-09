import { useCallback, useState } from 'react';
import type { CreateLeaveRequest, LeaveRequestDTO, LeaveStatus, LeaveType } from '@ems/shared';
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
  const { resetPage, refetch } = list;
  const changeStatus = useCallback(
    (v: string) => {
      setStatus(v);
      resetPage();
    },
    [resetPage],
  );
  const changeType = useCallback(
    (v: string) => {
      setType(v);
      resetPage();
    },
    [resetPage],
  );

  const apply = useCallback(
    async (payload: CreateLeaveRequest) => {
      await leaveApi.apply(payload);
      await refetch();
    },
    [refetch],
  );

  const approve = useCallback(
    async (id: string) => {
      await leaveApi.approve(id);
      await refetch();
    },
    [refetch],
  );

  const reject = useCallback(
    async (id: string) => {
      await leaveApi.reject(id);
      await refetch();
    },
    [refetch],
  );

  const cancel = useCallback(
    async (id: string) => {
      await leaveApi.cancel(id);
      await refetch();
    },
    [refetch],
  );

  return {
    ...list,
    status,
    type,
    setStatus: changeStatus,
    setType: changeType,
    apply,
    approve,
    reject,
    cancel,
  };
}
