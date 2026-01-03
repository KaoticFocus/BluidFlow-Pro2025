/**
 * ScheduleFlow API Schemas
 * 
 * Zod validation schemas for ScheduleFlow endpoints.
 * See: docs/scheduleflow/backend-prd-home.md
 * 
 * @module scheduleflow/schemas
 */

import { z } from 'zod';

// =============================================================================
// Enums
// =============================================================================

export const ScheduleStatus = z.enum(['draft', 'pending', 'approved', 'rejected']);
export type ScheduleStatus = z.infer<typeof ScheduleStatus>;

export const ActivityType = z.enum(['work', 'break', 'meeting', 'inspection', 'delivery', 'other']);
export type ActivityType = z.infer<typeof ActivityType>;

export const NotificationChannel = z.enum(['email', 'sms', 'push']);
export type NotificationChannel = z.infer<typeof NotificationChannel>;

export const ConstraintType = z.enum([
  'min_hours_between_shifts',
  'max_consecutive_days',
  'required_break_duration',
  'max_daily_hours',
  'blackout_dates',
]);
export type ConstraintType = z.infer<typeof ConstraintType>;

// =============================================================================
// Schedule Schemas
// =============================================================================

export const ListSchedulesSchema = z.object({
  status: z.string().optional(), // comma-separated statuses
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['name', 'startAt', 'updatedAt', 'status']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
export type ListSchedulesInput = z.infer<typeof ListSchedulesSchema>;

export const CreateScheduleSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  timezone: z.string().min(1).max(50).default('UTC'),
}).refine(
  (data) => new Date(data.endAt) > new Date(data.startAt),
  { message: 'End date must be after start date', path: ['endAt'] }
);
export type CreateScheduleInput = z.infer<typeof CreateScheduleSchema>;

export const UpdateScheduleSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  timezone: z.string().min(1).max(50).optional(),
});
export type UpdateScheduleInput = z.infer<typeof UpdateScheduleSchema>;

export const SubmitScheduleSchema = z.object({
  comment: z.string().max(1000).optional(),
});

export const ApproveScheduleSchema = z.object({
  comment: z.string().max(1000).optional(),
});

export const RejectScheduleSchema = z.object({
  reason: z.string().min(1).max(1000),
});

// =============================================================================
// Activity Schemas
// =============================================================================

export const CreateActivitySchema = z.object({
  name: z.string().min(1).max(255),
  activityType: ActivityType,
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  assignedUserId: z.string().uuid().optional(),
  assignedRoleId: z.string().uuid().optional(),
  location: z.string().max(255).optional(),
  notes: z.string().max(2000).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
}).refine(
  (data) => new Date(data.endAt) > new Date(data.startAt),
  { message: 'End time must be after start time', path: ['endAt'] }
);
export type CreateActivityInput = z.infer<typeof CreateActivitySchema>;

export const UpdateActivitySchema = CreateActivitySchema.partial();
export type UpdateActivityInput = z.infer<typeof UpdateActivitySchema>;

// =============================================================================
// Constraint Schemas
// =============================================================================

export const CreateConstraintSchema = z.object({
  name: z.string().min(1).max(100),
  type: ConstraintType,
  payload: z.record(z.unknown()).default({}),
  scheduleId: z.string().uuid().optional(), // org-level if omitted
  severity: z.enum(['info', 'warning', 'error']).default('warning'),
  isActive: z.boolean().default(true),
});
export type CreateConstraintInput = z.infer<typeof CreateConstraintSchema>;

// =============================================================================
// Notification Schemas
// =============================================================================

export const SendNotificationsSchema = z.object({
  recipientIds: z.array(z.string().uuid()).optional(), // all affected users if omitted
  channels: z.array(NotificationChannel).default(['email']),
  templateKey: z.string().min(1).max(50),
  preview: z.boolean().default(false),
});
export type SendNotificationsInput = z.infer<typeof SendNotificationsSchema>;

// =============================================================================
// Response Types
// =============================================================================

export type ScheduleListItem = {
  id: string;
  name: string;
  description?: string;
  startAt: string;
  endAt: string;
  timezone: string;
  status: ScheduleStatus;
  activityCount: number;
  assignedUsers: { id: string; name: string; avatarUrl?: string }[];
  createdAt: string;
  updatedAt: string;
};

export type ScheduleDetail = ScheduleListItem & {
  approvedBy?: { id: string; name: string };
  approvedAt?: string;
  rejectionReason?: string;
  activities: ActivityListItem[];
  createdBy: { id: string; name: string };
};

export type ActivityListItem = {
  id: string;
  name: string;
  activityType: ActivityType;
  startAt: string;
  endAt: string;
  assignedUser?: { id: string; name: string; avatarUrl?: string };
  location?: string;
  notes?: string;
  color?: string;
};

export type ConstraintListItem = {
  id: string;
  name: string;
  type: ConstraintType;
  payload: Record<string, unknown>;
  severity: 'info' | 'warning' | 'error';
  isActive: boolean;
  scheduleId?: string;
};

export type PaginatedResponse<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
};
