import { z } from 'zod';

/**
 * Zod schemas for the departments module. Query coercion (string → number) happens here so the
 * service receives clean, typed values.
 */
export const listDepartmentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().optional(),
  search: z.string().trim().optional(),
});
export type ListDepartmentsQuery = z.infer<typeof listDepartmentsQuerySchema>;

export const createDepartmentSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
  description: z.string().trim().max(2000).optional(),
  headId: z.string().uuid('headId must be a valid id').nullable().optional(),
});
export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;

// Update = every field optional (partial). PATCH semantics: send only what changes.
export const updateDepartmentSchema = createDepartmentSchema.partial();
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
