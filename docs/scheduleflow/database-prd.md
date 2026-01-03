# Database PRD — ScheduleFlow MVP

## Core Tables (existing nodes)
- schedules: plan header (tenant_id, project_id, baseline_json, start_date, end_date, tasks_count, status, approvals)
- schedule_activities: per-activity (title, start_date, end_date, duration_days, predecessor_ids, assignee_user_id, status, critical_path)
- constraints: plan-level constraints (type, details, added_by)
- notification_drafts: tenant-scoped drafts (type, channel, recipient, subject, body_md, proposed_send_at, approval fields)

## Extended Tables
- schedule_plans, schedule_items, schedule_item_resources, resource_availability_windows, resource_unavailability
- schedule_constraints, constraint_violations
- schedule_generation_runs (input snapshot, algorithm version, metrics)
- approval_requests (for plan/notifications), schedule_audit_log
- outbox/ai audit where applicable

## Relationships
- schedule_activities.schedule_id → schedules.id
- constraints.schedule_id → schedules.id
- notification_drafts.schedule_id → schedules.id

## Indices
- schedules: (tenant_id,status), (tenant_id,updated_at desc)
- schedule_activities: (schedule_id), (schedule_id,status), (schedule_id,critical_path)
- constraints: (schedule_id)
- notification_drafts: (tenant_id,schedule_id,approved)

## Notes
- All monetary/ids UUID; timestamps in UTC
- Idempotency for approve operations via unique constraint on (tenant_id, plan_id, status='approved')

## Acceptance
- Schema supports baseline generation, constraint storage/violations, notification drafts, and approval gating