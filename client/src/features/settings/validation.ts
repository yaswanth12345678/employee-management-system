import { z } from 'zod';

export const settingsFormSchema = z.object({
  theme: z.enum(['system', 'light', 'dark']),
  locale: z.string().trim().min(2, 'Locale is required').max(16),
  emailNotifications: z.boolean(),
  inAppNotifications: z.boolean(),
});

export type SettingsFormValues = z.infer<typeof settingsFormSchema>;
