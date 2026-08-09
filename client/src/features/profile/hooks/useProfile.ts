import { useCallback, useEffect, useState } from 'react';
import type { EmployeeDTO } from '@ems/shared';
import type { NormalizedError } from '../../../lib/http';
import * as profileApi from '../api/profileApi';
import type { PasswordValues, ProfileEditValues } from '../validation';

export function useProfile() {
  const [profile, setProfile] = useState<EmployeeDTO | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const refetch = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setProfile(await profileApi.getProfile());
    } catch (err) {
      setLoadError((err as NormalizedError).message);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const updateProfile = useCallback(async (values: ProfileEditValues): Promise<EmployeeDTO> => {
    setSavingProfile(true);
    try {
      const updated = await profileApi.updateProfile({
        phone: values.phone || null,
        dateOfBirth: values.dateOfBirth || null,
        avatarUrl: values.avatarUrl || null,
      });
      setProfile(updated);
      return updated;
    } finally {
      setSavingProfile(false);
    }
  }, []);

  const uploadAvatar = useCallback(async (file: File): Promise<EmployeeDTO> => {
    setUploadingAvatar(true);
    try {
      const updated = await profileApi.uploadAvatar(file);
      setProfile(updated);
      return updated;
    } finally {
      setUploadingAvatar(false);
    }
  }, []);

  const changePassword = useCallback(async (values: PasswordValues): Promise<void> => {
    setSavingPassword(true);
    try {
      await profileApi.changePassword(values);
    } finally {
      setSavingPassword(false);
    }
  }, []);

  return {
    profile,
    loadError,
    loading,
    savingProfile,
    savingPassword,
    uploadingAvatar,
    refetch,
    updateProfile,
    uploadAvatar,
    changePassword,
  };
}
