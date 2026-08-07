import { useEffect, useState } from 'react';
import type { ProjectDTO } from '@ems/shared';
import * as projectsApi from '../api/projectsApi';

/** Loads projects for use in dropdowns (e.g. the task form's project selector). */
export function useProjectOptions() {
  const [options, setOptions] = useState<ProjectDTO[]>([]);

  useEffect(() => {
    let active = true;
    projectsApi
      .list({ page: 1, limit: 100 })
      .then((res) => {
        if (active) setOptions(res.data);
      })
      .catch(() => {
        if (active) setOptions([]);
      });
    return () => {
      active = false;
    };
  }, []);

  return options;
}
