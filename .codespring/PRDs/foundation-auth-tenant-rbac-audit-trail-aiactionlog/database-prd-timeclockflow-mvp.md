## Feature Overview
TimeClockFlow MVP provides reminder scheduling, timesheet anomaly detection, and immutable audit logging for small contractor teams. The schema supports multi-tenant operation, row-level scoping by org_id, idempotent ingestion, and event-driven integration via outbox-compatible dedupe keys.

## Requirements
- Capture immutable clock events (punches) with provenance, geo, and device metadata; derive contiguous work spans and daily timesheets.
- Detect anomalies (missing clock-out, overlapping spans, unusually long/short spans, off-hours vs expectations) and maintain review workflow (open, muted, resolved).
- Store expected shift windows per employee/day to power reminders and anomaly context.
- Define reminder rules (e.g., pre-shift check-in, end-of-day clock-out, timesheet submit) and schedule/send jobs with delivery outcomes.
- Maintain an immutable audit trail for all user/system actions in this module.

## Data Model & Relationships
- time_punches (1) → time_spans (0..1 start/end reference) and timesheets (N:1).
- time_spans (N) → timesheets (N:1) and link to start/end punches.
- timesheets are daily per employee; roll up span totals and anomaly counts.
- time_anomalies link to a timesheet and optionally a span or punch.
- time_expectations define expected windows per employee/day.
- reminder_rules (org/employee scoped) → reminder_jobs (instances) → reminder_deliveries (provider outcomes).
- timeclock_audit_log is append-only and references targets by table/id.
- External soft-FKs: org_id → organizations, employee_id → employees/users, project_id → projects.

## Indexes & Constraints
- Multi-tenant: all tables include org_id; enforce RLS in application layer; add BTREE indexes on (org_id, …) for primary access paths.
- Uniqueness: timesheets unique (org_id, employee_id, work_date); dedupe_key unique on time_punches and reminder_jobs; anomaly hash unique (org_id, hash, type).
- Time-series indexes: time_punches (org_id, employee_id, occurred_at), time_spans (org_id, employee_id, start_at), time_anomalies (org_id, status, detected_at), reminder_jobs (status, scheduled_for).
- Partial indexes recommended for open records: where is_open = true, status IN ('open','pending').
- CHECK enums via VARCHAR constrained at application: punch_type IN('IN','OUT','BREAK_START','BREAK_END'); statuses as specified below.

## Data Migration Strategy
- Phase 1: Create tables with default values and required indexes.
- Phase 2: Backfill timesheets and spans from existing punches (if any):
  - Build spans by pairing IN/OUT; carry open spans if no OUT.
  - Aggregate per employee/day to populate timesheets.
- Phase 3: Run anomaly detector for last 30 days; persist time_anomalies with detector_version.
- Phase 4: Seed minimal default reminder_rules (org-level) and disable by default.
- All backfills use dedupe_key and idempotent upserts; write audit entries for bulk operations.

## Query Optimization Considerations
- Weekly payroll view: index on timesheets (org_id, employee_id, work_date) and JOIN via timesheet_id to spans and anomalies.
- Open anomaly review queue: index (org_id, status, detected_at DESC) with WHERE status='open'.
- Reminder dispatch worker: index reminder_jobs (status, scheduled_for ASC) and foreign key rule_id for rule hydration.
- Analytics: materialize daily timesheet totals if needed; avoid scanning time_punches in UI by using spans and timesheets.
- Consider monthly partitioning on time_punches by occurred_at for large orgs (>1M punches) with local indexes.

## User Stories
- As a field tech, if I haven't clocked in by my expected start, I receive a reminder.
- As an owner, I see and resolve open anomalies before approving payroll.
- As an admin, I can audit who edited or voided a punch with full context.

## Success Criteria
- ≥95% of reminders dispatched within ±2 minutes of scheduled_for.
- Anomaly precision/recall acceptable for MVP: <5% false positives after tuning (measured over 2 pay periods).
- Audit coverage: 100% of mutations in this module have corresponding audit records.

