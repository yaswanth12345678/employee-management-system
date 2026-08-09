import { z } from 'zod';

export const taskFormSchema = z.object({
  projectId: z.string().min(1, 'Project is required'),
  title: z.string().trim().min(2, 'Title must be at least 2 characters').max(200),
  description: z.string().trim().max(4000).optional(),
  assigneeId: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'in_review', 'blocked', 'done']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  dueDate: z.string().optional(),
  estimatedHours: z.string().optional(),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;

export const taskCommentSchema = z.object({
  body: z.string().trim().min(1, 'Comment is required').max(4000),
});

export type TaskCommentValues = z.infer<typeof taskCommentSchema>;
