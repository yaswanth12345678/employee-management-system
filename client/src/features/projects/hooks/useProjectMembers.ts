import { useCallback, useEffect, useState } from 'react';
import type { ProjectMemberDTO } from '@ems/shared';
import * as projectsApi from '../api/projectsApi';

export function useProjectMembers(projectId: string | null, open: boolean) {
  const [members, setMembers] = useState<ProjectMemberDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (id: string, isActive: () => boolean = () => true) => {
    setLoading(true);
    try {
      const list = await projectsApi.listMembers(id);
      if (isActive()) setMembers(list);
    } catch {
      if (isActive()) setMembers([]);
    } finally {
      if (isActive()) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open || !projectId) return undefined;
    let active = true;
    void load(projectId, () => active);
    return () => {
      active = false;
    };
  }, [open, projectId, load]);

  const addMember = useCallback(
    async (employeeId: string, roleOnProject?: string) => {
      if (!projectId) return;
      setBusy(true);
      try {
        await projectsApi.addMember(projectId, { employeeId, roleOnProject });
        await load(projectId);
      } finally {
        setBusy(false);
      }
    },
    [projectId, load],
  );

  const removeMember = useCallback(
    async (employeeId: string) => {
      if (!projectId) return;
      await projectsApi.removeMember(projectId, employeeId);
      await load(projectId);
    },
    [projectId, load],
  );

  return { members, loading, busy, addMember, removeMember };
}
