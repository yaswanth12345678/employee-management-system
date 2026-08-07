import { z } from 'zod';

export const leaveFormSchema = z.object({
  type: z.enum(['annual', 'sick', 'casual', 'unpaid', 'maternity', 'paternity']),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  reason: z.string().trim().max(1000).optional(),
});

export type LeaveFormValues = z.infer<typeof leaveFormSchema>;
