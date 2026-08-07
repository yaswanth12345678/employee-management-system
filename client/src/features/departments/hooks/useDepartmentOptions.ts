import { useEffect, useState } from 'react';
import type { DepartmentDTO } from '@ems/shared';
import * as departmentsApi from '../api/departmentsApi';

/**
 * Loads departments for use in <select> dropdowns (e.g. the employee form). Fetches once on
 * mount with a large page size. Exposed via the departments feature's public barrel so other
 * features consume it without reaching into internals.
 *
 * (For very large orgs this would become a searchable autocomplete rather than a full load.)
 */
export function useDepartmentOptions() {
  const [options, setOptions] = useState<DepartmentDTO[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    departmentsApi
      .list({ page: 1, limit: 100 })
      .then((res) => {
        if (active) setOptions(res.data);
      })
      .catch(() => {
        if (active) setOptions([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { options, loading };
}
