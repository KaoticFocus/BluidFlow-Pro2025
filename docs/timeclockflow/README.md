# TimeClockFlow — Documentation Index

This index consolidates all TimeClockFlow docs in the mindmap and points to specs, schema, and tasks.

## What’s included here (linked in repo)
- Frontend PRD — TimeClockFlow MVP (frontend-prd-mvp.md)
- Backend PRD — TimeClockFlow MVP (backend-prd-mvp.md)
- Database PRD — TimeClockFlow MVP (database-prd.md)
- Todos — TimeClockFlow MVP Implementation (todos.md)
- Reminder rules & Twilio integration outline (reminders-twilio.md)
- PRD — TimeClockFlow Home Screen (frontend-prd-home.md)

## Scope summary
TimeClockFlow provides:
- Mobile‑first clock in/out, timesheet day view
- Automated reminders (quiet hours respected)
- Anomaly detection (missed clock‑out, out‑of‑geo, overlaps) with manager review/resolve
- Events: TimeEntryPosted.v1, AnomalyDetected.v1 (via Outbox → EventLog)

## Key UI
- Mobile (Expo): ClockScreen.tsx, TimesheetScreen.tsx, ReminderPrefs
- Web: /timeclockflow (manager dashboard); /timeclockflow/days/[date]

## API (Hono) essentials
- POST /time/clock { action: IN|OUT|BREAK_START|BREAK_END, projectId?, deviceId?, lat?, lng? }
- GET  /time/days/:date?employeeId=me|uuid → entries, breaks, totals, anomalies
- POST /time/anomalies/:id/resolve { decision, note? }
- GET  /time/reminders/prefs; PATCH /time/reminders/prefs

## Workers (BullMQ)
- sendReminders.ts — schedule/send reminders (idempotent)
- detectAnomalies.ts — missed clock‑out, overlaps, out‑of‑geo, long spans

## Database (high‑level tables)
- time_entries, time_entry_breaks, timesheet_days, timesheet_anomalies
- reminder_rules, reminder_jobs, reminder_deliveries
- geofences, schedule_overrides
- audit + outbox tables for traceability/integration

## Guardrails
- Idempotent clock via dedupe (deviceId+timestamp)
- RBAC: Field vs Manager/Owner permissions
- Immutable audit rows for every change