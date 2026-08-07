import type { ApiResponse, ChangePasswordRequestBody, EmployeeDTO } from '@ems/shared';
import { httpClient } from '../../../lib/http';

interface UpdateProfilePayload {
  phone?: string | null;
  dateOfBirth?: string | null;
  avatarUrl?: string | null;
}

export async function getProfile(): Promise<EmployeeDTO> {
  const { data } = await httpClient.get<ApiResponse<EmployeeDTO>>('/profile');
  return data.data;
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<EmployeeDTO> {
  const { data } = await httpClient.patch<ApiResponse<EmployeeDTO>>('/profile', payload);
  return data.data;
}

export async function changePassword(payload: ChangePasswordRequestBody): Promise<void> {
  await httpClient.patch('/profile/password', payload);
}

export async function uploadAvatar(file: File): Promise<EmployeeDTO> {
  const form = new FormData();
  form.append('avatar', file);
  const { data } = await httpClient.post<ApiResponse<EmployeeDTO>>('/profile/avatar', form);
  return data.data;
}
