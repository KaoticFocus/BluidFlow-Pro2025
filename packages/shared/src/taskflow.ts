import { z } from "zod";

export const TaskSourceSchema = z.enum(["text", "voice", "photo"]);
export type TaskSource = z.infer<typeof TaskSourceSchema>;

export const TaskTypeSchema = z.enum(["general", "punch"]);
export type TaskType = z.infer<typeof TaskTypeSchema>;

export const TaskStatusSchema = z.enum([
  "draft",
  "pending_approval",
  "approved",
  "open",
  "in_progress",
  "done",
  "canceled"
]);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

export const TaskSchema = z.object({
  id: z.string().uuid(),
  org_id: z.string().min(1),
  project_id: z.string().min(1).nullable(),
  source: TaskSourceSchema,
  type: TaskTypeSchema,
  status: TaskStatusSchema,
  title: z.string().max(140),
  description_redacted: z.string().max(5000),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
});
export type Task = z.infer<typeof TaskSchema>;

export const DailyPlanStatusSchema = z.enum(["pending_approval", "approved", "published", "rejected"]);
export type DailyPlanStatus = z.infer<typeof DailyPlanStatusSchema>;

export const DailyPlanSchema = z.object({
  id: z.string().uuid(),
  org_id: z.string().min(1),
  project_id: z.string().min(1).nullable(),
  date: z.string().min(1),
  status: DailyPlanStatusSchema,
  created_at: z.string().datetime()
});
export type DailyPlan = z.infer<typeof DailyPlanSchema>;


