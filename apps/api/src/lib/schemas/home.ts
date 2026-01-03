import { z } from "zod";

/**
 * Home Summary Zod Schema
 * 
 * Defines the shape of the /v1/home/summary API response.
 * Only includes modules the user has access to.
 */

export const TasksSummarySchema = z.object({
  open: z.number().int().min(0),
  overdue: z.number().int().min(0),
});

export const MeetingsSummarySchema = z.object({
  upcoming: z.number().int().min(0),
  pending_review: z.number().int().min(0),
});

export const LeadsSummarySchema = z.object({
  new: z.number().int().min(0),
});

export const ScheduleSummarySchema = z.object({
  upcoming_plans: z.number().int().min(0),
});

export const TimeclockSummarySchema = z.object({
  active_sessions: z.number().int().min(0),
});

export const DocumentsSummarySchema = z.object({
  pending: z.number().int().min(0),
});

export const AISummarySchema = z.object({
  pending_review: z.number().int().min(0),
});

export const HomeSummarySchema = z.object({
  tasks: TasksSummarySchema.optional(),
  meetings: MeetingsSummarySchema.optional(),
  leads: LeadsSummarySchema.optional(),
  schedule: ScheduleSummarySchema.optional(),
  timeclock: TimeclockSummarySchema.optional(),
  documents: DocumentsSummarySchema.optional(),
  ai: AISummarySchema.optional(),
  updatedAt: z.string().datetime(),
});

export type HomeSummary = z.infer<typeof HomeSummarySchema>;
export type TasksSummary = z.infer<typeof TasksSummarySchema>;
export type MeetingsSummary = z.infer<typeof MeetingsSummarySchema>;
export type LeadsSummary = z.infer<typeof LeadsSummarySchema>;
export type ScheduleSummary = z.infer<typeof ScheduleSummarySchema>;
export type TimeclockSummary = z.infer<typeof TimeclockSummarySchema>;
export type DocumentsSummary = z.infer<typeof DocumentsSummarySchema>;
export type AISummary = z.infer<typeof AISummarySchema>;