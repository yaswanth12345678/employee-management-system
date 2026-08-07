import type { ThemePreference, UserSettingsDTO } from '@ems/shared';
import * as repo from './settings.repository';
import type { SettingsRow } from './settings.repository';
import type { UpdateSettingsInput } from './settings.validation';

function toDTO(row: SettingsRow): UserSettingsDTO {
  return {
    theme: row.theme as ThemePreference,
    locale: row.locale,
    emailNotifications: row.email_notifications,
    inAppNotifications: row.in_app_notifications,
  };
}

export async function get(userId: string): Promise<UserSettingsDTO> {
  return toDTO(await repo.getOrCreate(userId));
}

export async function update(userId: string, input: UpdateSettingsInput): Promise<UserSettingsDTO> {
  return toDTO(await repo.update(userId, input));
}
