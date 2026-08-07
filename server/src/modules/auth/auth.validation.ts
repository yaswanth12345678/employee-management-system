import { z } from 'zod';

/**
 * Request schemas for the auth module. The single source of truth for "what a valid request
 * body looks like" — used by the `validate` middleware. Note we do NOT enforce password
 * COMPLEXITY on login (only presence); complexity belongs on register/change-password.
 */
export const loginSchema = z.object({
  email: z.string().trim().email('A valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('A valid email is required'),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(10, 'Invalid reset token'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
