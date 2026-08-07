import { z } from 'zod';

export const profileEditSchema = z.object({
  phone: z.string().trim().max(20).optional(),
  dateOfBirth: z.string().optional(),
  avatarUrl: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
});
export type ProfileEditValues = z.infer<typeof profileEditSchema>;

export const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});
export type PasswordValues = z.infer<typeof passwordSchema>;
