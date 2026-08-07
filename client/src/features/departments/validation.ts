import { z } from 'zod';

/** Mirrors the server's department rules for instant client-side feedback. */
export const departmentFormSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
  description: z.string().trim().max(2000).optional(),
});

export type DepartmentFormValues = z.infer<typeof departmentFormSchema>;
