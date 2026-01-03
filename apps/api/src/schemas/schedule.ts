import { z } from 'zod';

export const PlanFilterSchema = z.object({
  status: z.enum(['draft', 'approved', 'archived']).optional(),
  range: z.string().optional(), // e.g., today|week|month|custom
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(200).optional(),
});

export const PlanCreateSchema = z.object({
  name: z.string().min(1),
  status: z.enum(['draft', 'approved', 'archived']).default('draft'),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
});

export type PlanFilter = z.infer<typeof PlanFilterSchema>;
export type PlanCreate = z.infer<typeof PlanCreateSchema>;
