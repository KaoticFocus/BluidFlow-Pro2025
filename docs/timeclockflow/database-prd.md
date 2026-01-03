# Database PRD — TimeClockFlow MVP

## Core Tables (existing nodes)
- time_entries: primary span records (clock in/out, geo, device, seconds, notes, status, version)
- time_entry_breaks: break segments per entry
- timesheets: per-employee per-day aggregates; approval/lock state
- timesheet_anomalies: anomalies with type, severity, status, detection and resolution metadata
- reminder_rules / reminder_jobs / reminder_deliveries: reminder scheduling and provider tracking
- geofences: optional project-level geofence hints
- schedule_overrides: manual schedule hints for reminders

## Auxiliary Tables
- time_punches, time_spans (alt designs), time_anomalies (normalized), time_expectations
- timeclock_audit_log / time_entry_audit_log: immutable audit trails
- timeclock_outbox_events: event outbox for integration

## Relationships & Indices
- time_entries(employee_id, project_id) with (tenant_id) scoping
- timesheets(employee_id, work_date) unique; indices for status and approvals
- anomalies(timesheet_day_id|time_entry_id) with status and detection hashes
- reminder_jobs(rule_id, employee_id, scheduled_for) dedupe keys; deliveries by job_id

## Notes
- All timestamps in UTC; tz handled in app layer
- Idempotent clock using dedupe key (employee + occurred_at + device)
- Soft-delete flags where required; audit tables capture before/after diffs

## Acceptance
- Schema supports reliable capture, reminders, anomaly lifecycle, approvals, and audit