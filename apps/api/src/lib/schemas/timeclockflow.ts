/**
 * TimeClockFlow API Schemas
 * 
 * Zod validation schemas for TimeClockFlow endpoints.
 * See: docs/timeclockflow/backend-prd-mvp.md
 * 
 * @module timeclockflow/schemas
 */

import { z } from 'zod';

// =============================================================================
// Enums
// =============================================================================

export const TimeEntryType = z.enum(['in', 'out', 'break_start', 'break_end']);
export type TimeEntryType = z.infer<typeof TimeEntryType>;

export const EntrySource = z.enum(['mobile', 'web', 'manual', 'import']);
export type EntrySource = z.infer<typeof EntrySource>;

export const AnomalyType = z.enum([
  'missing_out',
  'missing_in',
  'duplicate_in',
  'geofence_violation',
  'overtime_warning',
  'long_break',
  'short_shift',
]);
export type AnomalyType = z.infer<typeof AnomalyType>;

export const AnomalyResolutionAction = z.enum([
  'add_clock_out',
  'add_clock_in',
  'remove_duplicate',
  'add_justification',
  'dismiss',
]);
export type AnomalyResolutionAction = z.infer<typeof AnomalyResolutionAction>;

export const TimesheetStatus = z.enum(['open', 'submitted', 'approved', 'locked']);
export type TimesheetStatus = z.infer<typeof TimesheetStatus>;

export const ReminderRuleKey = z.enum([
  'late_clock_in',
  'missing_clock_out',
  'break_overrun',
  'daily_summary',
]);
export type ReminderRuleKey = z.infer<typeof ReminderRuleKey>;

// =============================================================================
// Geo Schema
// =============================================================================

export const GeoSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().min(0).optional(),
  altitude: z.number().optional(),
  heading: z.number().min(0).max(360).optional(),
  speed: z.number().min(0).optional(),
}).optional();
export type GeoInput = z.infer<typeof GeoSchema>;

// =============================================================================
// Clock In/Out Schemas
// =============================================================================

export const ClockInSchema = z.object({
  timestamp: z.string().datetime().optional(), // defaults to server time
  geo: GeoSchema,
  source: EntrySource.default('mobile'),
  notes: z.string().max(500).optional(),
});
export type ClockInInput = z.infer<typeof ClockInSchema>;

export const ClockOutSchema = z.object({
  timestamp: z.string().datetime().optional(),
  geo: GeoSchema,
  source: EntrySource.default('mobile'),
  notes: z.string().max(500).optional(),
});
export type ClockOutInput = z.infer<typeof ClockOutSchema>;

// =============================================================================
// Break Schemas
// =============================================================================

export const BreakStartSchema = z.object({
  timestamp: z.string().datetime().optional(),
});
export type BreakStartInput = z.infer<typeof BreakStartSchema>;

export const BreakEndSchema = z.object({
  timestamp: z.string().datetime().optional(),
});
export type BreakEndInput = z.infer<typeof BreakEndSchema>;

// =============================================================================
// Entry Query Schemas
// =============================================================================

export const ListEntriesSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // YYYY-MM-DD
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  type: TimeEntryType.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});
export type ListEntriesInput = z.infer<typeof ListEntriesSchema>;

export const UpdateEntrySchema = z.object({
  timestamp: z.string().datetime().optional(),
  notes: z.string().max(500).optional(),
});
export type UpdateEntryInput = z.infer<typeof UpdateEntrySchema>;

// =============================================================================
// Anomaly Schemas
// =============================================================================

export const ListAnomaliesSchema = z.object({
  status: z.enum(['pending', 'resolved', 'all']).default('pending'),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  type: AnomalyType.optional(),
});
export type ListAnomaliesInput = z.infer<typeof ListAnomaliesSchema>;

export const ResolveAnomalySchema = z.object({
  action: AnomalyResolutionAction,
  data: z.object({
    timestamp: z.string().datetime().optional(),
  }).optional(),
  notes: z.string().max(1000),
});
export type ResolveAnomalyInput = z.infer<typeof ResolveAnomalySchema>;

// =============================================================================
// Timesheet Schemas
// =============================================================================

export const ListTimesheetDaysSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  userId: z.string().uuid().optional(), // for supervisors
});
export type ListTimesheetDaysInput = z.infer<typeof ListTimesheetDaysSchema>;

// =============================================================================
// Reminder Schemas
// =============================================================================

export const UpdateReminderSchema = z.object({
  isActive: z.boolean().optional(),
  phoneNumber: z.string().regex(/^\+[1-9]\d{1,14}$/).optional(), // E.164 format
  payload: z.record(z.unknown()).optional(),
});
export type UpdateReminderInput = z.infer<typeof UpdateReminderSchema>;

// =============================================================================
// Geofence Schemas
// =============================================================================

export const CreateGeofenceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  geometry: z.object({
    type: z.enum(['Circle', 'Polygon']),
    center: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }).optional(),
    radius: z.number().min(10).max(10000).optional(), // meters
    coordinates: z.array(z.array(z.number())).optional(),
  }),
  activeHours: z.record(z.object({
    start: z.string().regex(/^\d{2}:\d{2}$/),
    end: z.string().regex(/^\d{2}:\d{2}$/),
  })).optional(),
  isActive: z.boolean().default(true),
});
export type CreateGeofenceInput = z.infer<typeof CreateGeofenceSchema>;

// =============================================================================
// Response Types
// =============================================================================

export type ClockStatus = {
  status: 'clocked_out' | 'clocked_in' | 'on_break';
  currentShift?: {
    startAt: string;
    durationMinutes: number;
    breakMinutes: number;
    onBreak: boolean;
    breakStartAt?: string;
  };
  lastEntry?: {
    id: string;
    type: TimeEntryType;
    at: string;
  };
  anomalyCount: number;
};

export type TimeEntryResponse = {
  id: string;
  type: TimeEntryType;
  at: string;
  source: EntrySource;
  geo?: GeoInput;
  geofenceMatch?: {
    matched: boolean;
    geofenceId?: string;
    geofenceName?: string;
  };
  notes?: string;
};

export type ShiftSummary = {
  startAt: string;
  endAt: string;
  totalMinutes: number;
  breakMinutes: number;
  netMinutes: number;
};

export type AnomalyResponse = {
  id: string;
  type: AnomalyType;
  severity: 'info' | 'warning' | 'error';
  message: string;
  detectedAt: string;
  entry?: {
    id: string;
    type: TimeEntryType;
    at: string;
  };
  resolvedAt?: string;
  resolvedBy?: { id: string; name: string };
  resolutionAction?: AnomalyResolutionAction;
  resolutionNotes?: string;
};

export type TimesheetDayResponse = {
  id: string;
  date: string;
  totalSeconds: number;
  breakSeconds: number;
  netSeconds: number;
  entryCount: number;
  status: TimesheetStatus;
  entries: TimeEntryResponse[];
};
