# Runbook — TimeClockFlow Operations

## Pre‑requisites
- DATABASE_URL + Redis available; workers running (sendReminders, detectAnomalies)
- SMS provider (Twilio) or email (Resend) credentials configured
- RBAC roles assigned (Field, Manager/Owner)

## Deploy checklist
1) Apply time_* tables and indices; verify prisma generate
2) Configure TWILIO_* (if SMS) and enable reminder queues
3) Start API + workers; confirm /time/days/:date works

## Operate
- Clock actions: POST /time/clock (mobile app)
- Review day: GET /time/days/:date; resolve anomalies via POST /time/anomalies/:id/resolve
- Reminders: configure rules (reminder_rules); verify jobs and deliveries

## Monitoring
- KPIs: open spans, anomaly rate, reminder send/delivery errors
- Telemetry: OTEL spans on endpoints/workers; Sentry for failures
- Provider logs: Twilio delivery status webhook (optional)

## Recovery
- Idempotent clock: retry POST safely with same dedupe key
- If anomaly detector down: re‑scan windows on startup

## Rollback
- Disable reminder queue consumers; keep clock endpoints active
- Revert anomaly rule changes if false positives spike