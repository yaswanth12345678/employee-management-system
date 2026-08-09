import { z } from 'zod';

/**
 * Client-side form schemas. We validate on the client for instant UX feedback, but the SERVER
 * still validates too (never trust the client). These schemas drive react-hook-form via the
 * zod resolver; form value types are inferred so handlers stay in sync.
 */
export const loginFormSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
});

export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
