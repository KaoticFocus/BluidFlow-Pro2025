# Todos — TimeClockFlow MVP Implementation

- API: apps/api/src/routes/timeclock.ts — implement POST /time/clock, GET day, approvals, anomalies
- DTOs: apps/api/src/schemas/time.ts — ClockRequest, TimesheetDayQuery, AnomalyResolveRequest, ReminderPreferences
- Workers: detectAnomalies.ts and sendReminders.ts; wire BullMQ queues and idempotency
- RBAC: Field vs Manager/Owner permissions; enforce in middleware
- Mobile UI: ClockScreen.tsx with GeoFenceNotice + ClockButton; TimesheetScreen.tsx
- Web UI: timesheet day detail, anomalies list + resolve action, reminder settings
- Events: publish TimeEntryPosted.v1, AnomalyDetected.v1; consume approvals idempotently
- Telemetry: PostHog (clock_in/out, anomaly_resolved), OTEL spans; Sentry guards
- Tests: unit (clock transitions), integration (anomaly detect/resolve), E2E (mobile clock → manager approve)