import { useEffect, useState } from 'react';
import { Box, FormControlLabel, MenuItem, Paper, Stack, Switch, TextField } from '@mui/material';
import type { ThemePreference, UserSettingsDTO } from '@ems/shared';
import type { NormalizedError } from '../../../lib/http';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Button } from '../../../components/ui/Button';
import { PageLoader } from '../../../components/feedback/PageLoader';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { useSnackbar } from '../../../contexts/SnackbarContext';
import { useColorMode } from '../../../theme/ColorModeProvider';
import * as settingsApi from '../api/settingsApi';

const THEMES: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export function SettingsPage() {
  const { notify } = useSnackbar();
  const { setMode, previewMode, revertToStored } = useColorMode();
  const [settings, setSettings] = useState<UserSettingsDTO | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const data = await settingsApi.get();
      setSettings(data);
      setMode(data.theme); // apply + persist the saved theme
    } catch (err) {
      setLoadError((err as NormalizedError).message);
    }
  };

  useEffect(() => {
    void load();
    // Discard any unsaved live-preview theme when leaving the page, so previewing Dark then
    // navigating away without saving doesn't persist Dark app-wide across reloads.
    return () => revertToStored();
  }, [revertToStored]);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const saved = await settingsApi.update(settings);
      setSettings(saved);
      setMode(saved.theme); // now persist the previewed theme
      notify('Settings saved', 'success');
    } catch (err) {
      notify((err as NormalizedError).message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loadError) return <ErrorState message={loadError} onRetry={load} />;
  if (!settings) return <PageLoader />;

  const patch = (fields: Partial<UserSettingsDTO>) => setSettings({ ...settings, ...fields });

  return (
    <>
      <PageHeader title="Settings" subtitle="Manage your preferences" />

      <Paper variant="outlined" sx={{ p: 3, maxWidth: 480 }}>
        <Stack spacing={2.5}>
          <TextField
            select
            label="Theme"
            value={settings.theme}
            onChange={(e) => {
              const next = e.target.value as ThemePreference;
              patch({ theme: next });
              previewMode(next); // live, revertible preview (not persisted until Save)
            }}
            fullWidth
          >
            {THEMES.map((t) => (
              <MenuItem key={t.value} value={t.value}>
                {t.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Locale"
            value={settings.locale}
            onChange={(e) => patch({ locale: e.target.value })}
            fullWidth
          />

          <FormControlLabel
            control={
              <Switch
                checked={settings.emailNotifications}
                onChange={(e) => patch({ emailNotifications: e.target.checked })}
              />
            }
            label="Email notifications"
          />
          <FormControlLabel
            control={
              <Switch
                checked={settings.inAppNotifications}
                onChange={(e) => patch({ inAppNotifications: e.target.checked })}
              />
            }
            label="In-app notifications"
          />

          <Box>
            <Button variant="contained" onClick={handleSave} loading={saving}>
              Save settings
            </Button>
          </Box>
        </Stack>
      </Paper>
    </>
  );
}
