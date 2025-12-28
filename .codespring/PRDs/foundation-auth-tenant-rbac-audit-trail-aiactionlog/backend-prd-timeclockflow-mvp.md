# TimeClockFlow MVP

## Feature Overview
Deliver backend support for reminders, timesheet anomaly detection, and immutable audit for TimeClockFlow. Scope covers tenant-configurable reminders (clock-in/clock-out), automatic anomaly detection (missing clock-out, overlap, geofence mismatch), and append-only audit logs for all timesheet-affecting actions.

## Requirements

- Reminders
  - Generate clock-in and clock-out reminder candidates based on schedule/project events and active shifts.
  - Channels: push, SMS (Twilio), email (Resend). Per-tenant channel toggles and approval requirements.
  - Respect quiet hours and time zone per tenant/user.
  - Dedupe by (tenant_id, user_id, type, window_key); expire pending reminders after window end.
  - Dry-run preview and explicit approval before external send if required by settings.

- Anomaly Detection
  - Types: missing_clock_out (default threshold 10h), overlapping_shifts (same user, overlapping intervals), geo_mismatch (distance > configurable meters between job site and clock-in/out capture).
  - Create anomaly on detection with severity (low/med/high) and evidence snapshot.
  - Prevent duplicates per shift/type; update evidence if re-detected.
  - Resolution workflow: resolve, ignore, or mark false_positive with mandatory note; side-effects (e.g., auto-add clock-out) produce audit entries and events.

- Audit (immutable)
  - Append-only audit for: reminder lifecycle (created/sent/suppressed), anomaly lifecycle (opened/updated/resolved), shift edits from anomaly resolution.
  - Hash chain: record_hash = SHA256(prev_hash + payload); store prev_hash; no updates allowed.
  - Include actor, source (api/system/ai), correlation_id, previous/next snapshots.

- Events (outbox; idempotent)
  - timeclock.reminder.created|sent|failed|suppressed.v1
  - timeclock.anomaly.opened|updated|resolved.v1
  - timeclock.audit.logged.v1

- RBAC
  - employee: read own reminders/anomalies; acknowledge.
  - crew_lead: read team; request resolutions.
  - owner_admin: configure settings; approve sends; resolve anomalies; audit read.

## API Endpoints (Hono, JSON, ISO-8601 UTC, Zod-validated)

- GET /api/timeclock/settings
  - Returns tenant settings: channels, approval_required, quiet_hours, thresholds (hours, geo_meters), timezone.
- PUT /api/timeclock/settings
  - Body: { channels: {sms:boolean,email:boolean,push:boolean}, approval_required: {sms:boolean,email:boolean}, quiet_hours: {start:string,end:string}, thresholds: {max_shift_hours:number, geo_meters:number} }
  - Auth: owner_admin.

- GET /api/timeclock/reminders/pending?user_id=&type=&before=&after=
  - List pending reminder candidates.
- POST /api/timeclock/reminders/preview
  - Body: { user_ids?: string[], types?: ["clock_in","clock_out"], window: {start:string,end:string} }
  - Returns calculated candidates without persisting.
- POST /api/timeclock/reminders/approve
  - Body: { reminder_ids: string[] } -> sends if allowed; otherwise marks suppressed with reason.
- POST /api/timeclock/reminders/test
  - Body: { user_id:string, channel:"sms"|"email"|"push" }

- GET /api/timeclock/anomalies?status=open|resolved|ignored&type=&user_id=&project_id=&from=&to=
  - Paginated list with evidence.
- POST /api/timeclock/anomalies/:id/resolve
  - Body: { resolution_code:"clock_out_added"|"false_positive"|"ignored"|"split_shift", note:string, adjustments?: { clock_out_at?: string, split_at?: string } }
  - Emits audit + resolved event; applies adjustments if provided.
- POST /api/timeclock/anomalies/recompute
  - Body: { from:string, to:string, user_ids?:string[] } (admin only)

- GET /api/timeclock/audit?entity_type=&entity_id=&actor_id=&from=&to=
  - Append-only, paginated; includes hashes.

## Data Model (Postgres/Prisma)

- Reminder: id, tenant_id, user_id, type, channel, scheduled_at, window_start/end, status(pending|sent|failed|suppressed|expired), approval_required, approved_by, sent_at, dedupe_key, payload(jsonb), attempts, last_error, source_event_id, created_at.
- Anomaly: id, tenant_id, user_id, shift_id, type, status(open|resolved|ignored), severity, detected_at, resolved_at, resolution_code, resolved_by, note, evidence(jsonb), dedupe_key.
- Audit: id, tenant_id, entity_type, entity_id, action, actor_type, actor_id, actor_ip, source, previous(jsonb), next(jsonb), reason, correlation_id, prev_hash, record_hash, created_at.

## Processing & Jobs

- BullMQ queues:
  - reminder-evaluator: runs on schedule and shift events; enqueues sends respecting approvals.
  - shift-watchdog: schedules check at max_shift_hours for missing_clock_out.
  - anomaly-evaluator: on shift started/ended updates; geo checks if location present.
- Idempotency: x-idempotency-key header honored on approval/send; unique (tenant, dedupe_key).

## Security & Compliance

- Auth via Better-auth; tenant isolation; per-endpoint scope checks.
- PII redaction in logs/events; SMS/email requires consent_on_file flag on Employee.
- Rate limits per tenant/user for outbound channels; retry with backoff on transient failures.

## Observability

- OpenTelemetry spans for evaluators and sends; Sentry for failures; PostHog event for each anomaly and reminder decision.

## User Stories

- As a crew lead, I receive a clock-out reminder if my shift exceeds policy and I'm still clocked in.
- As an owner, I see and resolve open anomalies, adding a missing clock-out with an audited reason.
- As an admin, I preview and bulk-approve today's reminders before any SMS is sent.

## Success Criteria

- <2 min latency from threshold to reminder creation; <30s median send after approval.
- ≥95% detection accuracy for missing_clock_out and overlap (validated against seed data).
- Zero mutable audit records; hash chain verifies end-to-end integrity.
- Event delivery exactly-once to outbox consumers (no duplicate downstream side effects).
- Channel opt-in honored; no external message sent without approval when required.

