import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, FormControlLabel, Paper, Stack, Switch } from '@mui/material';
import type { ThemePreference } from '@ems/shared';
import type { NormalizedError } from '../../../lib/http';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Button } from '../../../components/ui/Button';
import { FormTextField } from '../../../components/forms/FormTextField';
import { PageLoader } from '../../../components/feedback/PageLoader';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { useSnackbar } from '../../../contexts/SnackbarContext';
import { useColorMode } from '../../../theme/ColorModeProvider';
import { useSettings } from '../hooks/useSettings';
import { settingsFormSchema, type SettingsFormValues } from '../validation';

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export function SettingsPage() {
  const { notify } = useSnackbar();
  const { setMode, previewMode, revertToStored } = useColorMode();
  const { settings, loadError, loading, saving, refetch, save } = useSettings();

  const { control, handleSubmit, reset, watch } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      theme: 'system',
      locale: 'en',
      emailNotifications: true,
      inAppNotifications: true,
    },
  });

  useEffect(() => {
    if (!settings) return;
    reset({
      theme: settings.theme,
      locale: settings.locale,
      emailNotifications: settings.emailNotifications,
      inAppNotifications: settings.inAppNotifications,
    });
    setMode(settings.theme);
  }, [settings, reset, setMode]);

  useEffect(() => {
    // Discard any unsaved live-preview theme when leaving the page.
    return () => revertToStored();
  }, [revertToStored]);

  // Live preview theme changes without persisting until Save.
  const themeValue = watch('theme');
  useEffect(() => {
    if (settings) previewMode(themeValue);
  }, [themeValue, previewMode, settings]);

  const onSubmit = async (values: SettingsFormValues) => {
    try {
      const saved = await save(values);
      setMode(saved.theme);
      notify('Settings saved', 'success');
    } catch (err) {
      notify((err as NormalizedError).message, 'error');
    }
  };

  if (loadError) return <ErrorState message={loadError} onRetry={refetch} />;
  if (loading || !settings) return <PageLoader />;

  return (
    <>
      <PageHeader title="Settings" subtitle="Manage your preferences" />

      <Paper variant="outlined" sx={{ p: 3, maxWidth: 480 }}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Stack spacing={2.5}>
            <FormTextField
              control={control}
              name="theme"
              label="Theme"
              select
              options={THEME_OPTIONS}
              fullWidth
            />

            <FormTextField control={control} name="locale" label="Locale" fullWidth />

            <Controller
              control={control}
              name="emailNotifications"
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch
                      checked={field.value}
                      onChange={(_, checked) => field.onChange(checked)}
                    />
                  }
                  label="Email notifications"
                />
              )}
            />
            <Controller
              control={control}
              name="inAppNotifications"
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch
                      checked={field.value}
                      onChange={(_, checked) => field.onChange(checked)}
                    />
                  }
                  label="In-app notifications"
                />
              )}
            />

            <Box>
              <Button type="submit" variant="contained" loading={saving}>
                Save settings
              </Button>
            </Box>
          </Stack>
        </Box>
      </Paper>
    </>
  );
}
