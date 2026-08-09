import { useCallback, useEffect, useState } from 'react';
import type { UserSettingsDTO } from '@ems/shared';
import type { NormalizedError } from '../../../lib/http';
import * as settingsApi from '../api/settingsApi';
import type { SettingsFormValues } from '../validation';

export function useSettings() {
  const [settings, setSettings] = useState<UserSettingsDTO | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const refetch = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setSettings(await settingsApi.get());
    } catch (err) {
      setLoadError((err as NormalizedError).message);
      setSettings(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const save = useCallback(async (values: SettingsFormValues): Promise<UserSettingsDTO> => {
    setSaving(true);
    try {
      const saved = await settingsApi.update(values);
      setSettings(saved);
      return saved;
    } finally {
      setSaving(false);
    }
  }, []);

  return { settings, loadError, loading, saving, refetch, save };
}
