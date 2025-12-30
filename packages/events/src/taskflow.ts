import { z } from "zod";
import { BaseEventSchema } from "./foundation";

// ============================================================================
// TASKFLOW EVENTS
// ============================================================================

export const TaskCreatedEventSchema = BaseEventSchema.extend({
  eventType: z.literal("task.created.v1"),
  payload: z.object({
    taskId: z.string().uuid(),
    projectId: z.string().uuid().nullable(),
    source: z.enum(["text", "voice", "photo", "manual"]),
    status: z.string(),
    aiGenerated: z.boolean(),
  }),
});

export type TaskCreatedEvent = z.infer<typeof TaskCreatedEventSchema>;

export const TaskUpdatedEventSchema = BaseEventSchema.extend({
  eventType: z.literal("task.updated.v1"),
  payload: z.object({
    taskId: z.string().uuid(),
    changes: z.record(z.unknown()),
  }),
});

export type TaskUpdatedEvent = z.infer<typeof TaskUpdatedEventSchema>;

export const TaskApprovedEventSchema = BaseEventSchema.extend({
  eventType: z.literal("task.approved.v1"),
  payload: z.object({
    taskId: z.string().uuid(),
    note: z.string().nullable(),
  }),
});

export type TaskApprovedEvent = z.infer<typeof TaskApprovedEventSchema>;

export const TaskCompletedEventSchema = BaseEventSchema.extend({
  eventType: z.literal("task.completed.v1"),
  payload: z.object({
    taskId: z.string().uuid(),
    autoCompleted: z.boolean().optional(),
    reason: z.string().nullable().optional(),
  }),
});

export type TaskCompletedEvent = z.infer<typeof TaskCompletedEventSchema>;

export const ChecklistItemCreatedEventSchema = BaseEventSchema.extend({
  eventType: z.literal("task.checklist_item.created.v1"),
  payload: z.object({
    taskId: z.string().uuid(),
    checklistItemId: z.string().uuid(),
    title: z.string(),
  }),
});

export type ChecklistItemCreatedEvent = z.infer<typeof ChecklistItemCreatedEventSchema>;

export const ChecklistItemUpdatedEventSchema = BaseEventSchema.extend({
  eventType: z.literal("task.checklist_item.updated.v1"),
  payload: z.object({
    taskId: z.string().uuid(),
    checklistItemId: z.string().uuid(),
    changes: z.record(z.unknown()),
  }),
});

export type ChecklistItemUpdatedEvent = z.infer<typeof ChecklistItemUpdatedEventSchema>;

export const DailyPlanGeneratedEventSchema = BaseEventSchema.extend({
  eventType: z.literal("daily_plan.generated.v1"),
  payload: z.object({
    dailyPlanId: z.string().uuid(),
    date: z.string(),
    taskIds: z.array(z.string().uuid()),
    metrics: z.object({
      total: z.number(),
      pinned: z.number(),
      dueToday: z.number(),
      overdue: z.number(),
    }),
  }),
});

export type DailyPlanGeneratedEvent = z.infer<typeof DailyPlanGeneratedEventSchema>;

export const DailyPlanApprovedEventSchema = BaseEventSchema.extend({
  eventType: z.literal("daily_plan.approved.v1"),
  payload: z.object({
    dailyPlanId: z.string().uuid(),
    date: z.string(),
    taskIds: z.array(z.string().uuid()),
    note: z.string().nullable(),
  }),
});

export type DailyPlanApprovedEvent = z.infer<typeof DailyPlanApprovedEventSchema>;

// ============================================================================
// EVENT TYPES UNION
// ============================================================================

export type TaskFlowEvent =
  | TaskCreatedEvent
  | TaskUpdatedEvent
  | TaskApprovedEvent
  | TaskCompletedEvent
  | ChecklistItemCreatedEvent
  | ChecklistItemUpdatedEvent
  | DailyPlanGeneratedEvent
  | DailyPlanApprovedEvent;

export const TASKFLOW_EVENT_TYPES = [
  "task.created.v1",
  "task.updated.v1",
  "task.approved.v1",
  "task.completed.v1",
  "task.checklist_item.created.v1",
  "task.checklist_item.updated.v1",
  "daily_plan.generated.v1",
  "daily_plan.approved.v1",
] as const;

export type TaskFlowEventType = (typeof TASKFLOW_EVENT_TYPES)[number];


