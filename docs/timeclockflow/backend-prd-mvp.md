# Backend PRD — TimeClockFlow MVP

## Overview
Implement time capture, reminders, and anomaly detection services with RBAC and audit.

## Endpoints (Hono)
- POST /time/clock { action:'IN'|'OUT'|'BREAK_START'|'BREAK_END', projectId?, deviceId?, lat?, lng? } → { entry/span state }
- GET  /time/days/:date?employeeId=me|uuid → { entries, breaks, totals, anomalies }
- POST /time/anomalies/:id/resolve { decision, note? } → { status }
- GET  /time/reminders/prefs → { timezone, quietHours, channels, rules }
- PATCH /time/reminders/prefs { ... }

## Workers (BullMQ)
- sendReminders.ts — schedule/send clock reminders honoring quiet hours and prefs
- detectAnomalies.ts — rules (missed clock-out, out-of-geo, overlapping, long spans)

## Events (v1)
- TimeEntryPosted, AnomalyDetected, AnomalyResolved

## RBAC & Tenancy
- Field: can clock self, view own day
- Manager/Owner: view team, resolve anomalies, configure rules
- All actions are tenant-scoped; immutable audit rows on every change

## Validation & Errors
- Zod DTOs: ClockRequest, TimesheetDayQuery, AnomalyResolveRequest, ReminderPreferences
- Idempotency via dedupe keys (per deviceId+timestamp) for clock

## Performance
- Indices across time_spans, time_entries, timesheets; p95 per endpoint < 500–800ms

## Telemetry
- OTEL spans per endpoint & worker; Sentry guarded