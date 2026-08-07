import { z } from 'zod';

/**
 * Client-side form schema. We validate on the client for instant UX feedback, but the SERVER
 * still validates too (never trust the client). This schema drives react-hook-form via the
 * zod resolver; `LoginFormValues` is inferred so the form and its handler stay in sync.
 */
export const loginFormSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;
