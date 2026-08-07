export type ThemePreference = 'light' | 'dark' | 'system';

export interface UserSettingsDTO {
  theme: ThemePreference;
  locale: string;
  emailNotifications: boolean;
  inAppNotifications: boolean;
}

export type UpdateSettingsRequest = Partial<UserSettingsDTO>;

export interface ChangePasswordRequestBody {
  currentPassword: string;
  newPassword: string;
}
