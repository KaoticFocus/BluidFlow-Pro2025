import { z } from 'zod';

/**
 * Schedule Plan Schemas
 * 
 * Used for validating API requests for schedule plan endpoints.
 */

/**
 * Plan status enum
 */
export const PlanStatusSchema = z.enum(['draft', 'submitted', 'approved']);
export type PlanStatus = z.infer<typeof PlanStatusSchema>;

/**
 * Filter schema for GET /schedule/plans
 * 
 * @param status - Filter by plan status
 * @param from - Filter plans starting from this ISO date
 * @param to - Filter plans ending before this ISO date
 * @param page - Page number (default 1)
 * @param pageSize - Items per page (default 20, max 200)
 */
export const PlanFilterSchema = z.object({
  status: PlanStatusSchema.optional(),
  from: z.string().optional(), // ISO date string
  to: z.string().optional(),   // ISO date string
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(200).optional().default(20),
});

/**
 * Create schema for POST /schedule/plans
 * 
 * @param name - Plan name (required)
 * @param startsAt - Optional start date (ISO string)
 * @param endsAt - Optional end date (ISO string)
 */
export const PlanCreateSchema = z.object({
  name: z.string().min(1, "Plan name is required"),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
});

/**
 * Plan entity type
 */
export interface Plan {
  id: string;
  name: string;
  status: PlanStatus;
  startsAt?: string;
  endsAt?: string;
}

export type PlanFilter = z.infer<typeof PlanFilterSchema>;
export type PlanCreate = z.infer<typeof PlanCreateSchema>;
