import { useEffect, useState } from 'react';
import type { EmployeeDTO } from '@ems/shared';
import * as employeesApi from '../api/employeesApi';

/** Loads employees for the "manager" dropdown in the employee form. */
export function useEmployeeOptions() {
  const [options, setOptions] = useState<EmployeeDTO[]>([]);

  useEffect(() => {
    let active = true;
    employeesApi
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
