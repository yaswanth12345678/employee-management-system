import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Avatar, Box, Divider, Grid, Paper, Stack, Typography } from '@mui/material';
import type { EmployeeDTO } from '@ems/shared';
import type { NormalizedError } from '../../../lib/http';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Button } from '../../../components/ui/Button';
import { FormTextField } from '../../../components/forms/FormTextField';
import { PageLoader } from '../../../components/feedback/PageLoader';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { useSnackbar } from '../../../contexts/SnackbarContext';
import * as profileApi from '../api/profileApi';
import {
  passwordSchema,
  profileEditSchema,
  type PasswordValues,
  type ProfileEditValues,
} from '../validation';

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <Grid item xs={12} sm={6}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2">{value || '—'}</Typography>
    </Grid>
  );
}

export function ProfilePage() {
  const { notify } = useSnackbar();
  const [profile, setProfile] = useState<EmployeeDTO | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editForm = useForm<ProfileEditValues>({
    resolver: zodResolver(profileEditSchema),
    defaultValues: { phone: '', dateOfBirth: '', avatarUrl: '' },
  });
  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '' },
  });

  const load = async () => {
    try {
      const data = await profileApi.getProfile();
      setProfile(data);
      editForm.reset({
        phone: data.phone ?? '',
        dateOfBirth: data.dateOfBirth ?? '',
        avatarUrl: data.avatarUrl ?? '',
      });
    } catch (err) {
      setLoadError((err as NormalizedError).message);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleSaveProfile = async (values: ProfileEditValues) => {
    setSavingProfile(true);
    try {
      const updated = await profileApi.updateProfile({
        phone: values.phone || null,
        dateOfBirth: values.dateOfBirth || null,
        avatarUrl: values.avatarUrl || null,
      });
      setProfile(updated);
      notify('Profile updated', 'success');
    } catch (err) {
      notify((err as NormalizedError).message, 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ''; // allow re-selecting the same file
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const updated = await profileApi.uploadAvatar(file);
      setProfile(updated);
      notify('Photo updated', 'success');
    } catch (err) {
      notify((err as NormalizedError).message, 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleChangePassword = async (values: PasswordValues) => {
    setSavingPassword(true);
    try {
      await profileApi.changePassword(values);
      notify('Password changed', 'success');
      passwordForm.reset({ currentPassword: '', newPassword: '' });
    } catch (err) {
      notify((err as NormalizedError).message, 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loadError) return <ErrorState message={loadError} onRetry={load} />;
  if (!profile) return <PageLoader />;

  return (
    <>
      <PageHeader title="My Profile" subtitle="View and update your account" />

      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Avatar src={profile.avatarUrl} sx={{ width: 56, height: 56 }}>
            {profile.firstName.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="h6">
              {profile.firstName} {profile.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {profile.jobTitle ?? '—'} · {profile.employeeCode}
            </Typography>
          </Box>
          <Box sx={{ ml: 'auto' }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              hidden
              onChange={handleAvatarSelected}
            />
            <Button
              variant="outlined"
              size="small"
              loading={uploadingAvatar}
              onClick={() => fileInputRef.current?.click()}
            >
              Change photo
            </Button>
          </Box>
        </Stack>
        <Grid container spacing={2}>
          <InfoRow label="Email" value={profile.email} />
          <InfoRow label="Role" value={profile.role} />
          <InfoRow label="Department" value={profile.department?.name} />
          <InfoRow label="Hire date" value={profile.hireDate} />
        </Grid>
      </Paper>

      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
          Edit details
        </Typography>
        <Box component="form" onSubmit={editForm.handleSubmit(handleSaveProfile)} noValidate>
          <Stack spacing={2} sx={{ maxWidth: 480 }}>
            <FormTextField control={editForm.control} name="phone" label="Phone" fullWidth />
            <FormTextField
              control={editForm.control}
              name="dateOfBirth"
              label="Date of birth"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <FormTextField control={editForm.control} name="avatarUrl" label="Avatar URL" fullWidth />
            <Box>
              <Button type="submit" variant="contained" loading={savingProfile}>
                Save changes
              </Button>
            </Box>
          </Stack>
        </Box>
      </Paper>

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
          Change password
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Box component="form" onSubmit={passwordForm.handleSubmit(handleChangePassword)} noValidate>
          <Stack spacing={2} sx={{ maxWidth: 480 }}>
            <FormTextField
              control={passwordForm.control}
              name="currentPassword"
              label="Current password"
              type="password"
              fullWidth
            />
            <FormTextField
              control={passwordForm.control}
              name="newPassword"
              label="New password"
              type="password"
              fullWidth
            />
            <Box>
              <Button type="submit" variant="contained" loading={savingPassword}>
                Update password
              </Button>
            </Box>
          </Stack>
        </Box>
      </Paper>
    </>
  );
}
