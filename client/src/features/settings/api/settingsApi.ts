import type { ApiResponse, UpdateSettingsRequest, UserSettingsDTO } from '@ems/shared';
import { httpClient } from '../../../lib/http';

export async function get(): Promise<UserSettingsDTO> {
  const { data } = await httpClient.get<ApiResponse<UserSettingsDTO>>('/settings');
  return data.data;
}

export async function update(payload: UpdateSettingsRequest): Promise<UserSettingsDTO> {
  const { data } = await httpClient.patch<ApiResponse<UserSettingsDTO>>('/settings', payload);
  return data.data;
}
