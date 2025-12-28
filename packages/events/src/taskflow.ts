import { z } from "zod";

// Minimal versioned TaskFlow event payload stubs.
// In the full architecture, these live under packages/events/src/schemas/taskflow/*.ts and are registered.

export const TaskCreatedV1Schema = z.object({
  event_id: z.string().uuid(),
  occurred_at: z.string().datetime(),
  org_id: z.string().min(1),
  project_id: z.string().min(1).nullable(),
  task_id: z.string().uuid(),
  source: z.enum(["text", "voice", "photo"])
});
export type TaskCreatedV1 = z.infer<typeof TaskCreatedV1Schema>;

export const TaskApprovedV1Schema = z.object({
  event_id: z.string().uuid(),
  occurred_at: z.string().datetime(),
  org_id: z.string().min(1),
  task_id: z.string().uuid(),
  approved_by: z.string().min(1).nullable()
});
export type TaskApprovedV1 = z.infer<typeof TaskApprovedV1Schema>;

export const DailyPlanGeneratedV1Schema = z.object({
  event_id: z.string().uuid(),
  occurred_at: z.string().datetime(),
  org_id: z.string().min(1),
  project_id: z.string().min(1).nullable(),
  daily_plan_id: z.string().uuid(),
  date: z.string().min(1)
});
export type DailyPlanGeneratedV1 = z.infer<typeof DailyPlanGeneratedV1Schema>;


