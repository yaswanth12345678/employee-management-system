import { z } from 'zod';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const updateProfileSchema = z.object({
  phone: z.string().trim().max(20).nullable().optional(),
  dateOfBirth: z.string().regex(DATE_RE).nullable().optional(),
  avatarUrl: z.string().url().max(500).nullable().optional(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
