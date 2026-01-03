# ScheduleFlow — Documentation Index

This index consolidates all ScheduleFlow docs in the mindmap and points to specs, schema, and tasks.

## What’s included here (linked in repo)
- Frontend PRD — ScheduleFlow MVP (see prd-mvp.md)
- Backend PRD — ScheduleFlow MVP (see prd-mvp.md)
- Database PRD — ScheduleFlow MVP (database-prd.md)
- PRD — ScheduleFlow MVP: Baseline + Constraints + Notifications (prd-mvp.md)
- Frontend PRD — ScheduleFlow Home Screen (frontend-prd-home.md)
- Backend PRD — ScheduleFlow Home Screen (backend-prd-home.md)
- Todos — ScheduleFlow MVP (baseline generation, approvals, notifications, events) [tracked in mindmap]
- Code Skeletons for home (code-skeletons.md)

## Scope summary
ScheduleFlow provides:
- Draft/approve schedule plans with simple dependency-based baseline generation
- Constraint capture and violation reporting
- Notification drafts (email/SMS) for milestones (approval-gated)
- Events: ScheduleGenerated.v1, ScheduleChanged.v1 (via Outbox → EventLog)

## Key UI (Next.js)
- /apps/web/src/app/scheduleflow/page.tsx (home)
- /apps/web/src/app/scheduleflow/[planId]/page.tsx (detail)
- UI components (packages/ui): schedule/PlanTimeline.tsx, ConstraintList.tsx, NotificationDrafts.tsx, PlanRow.tsx, PlanFilters.tsx

## API (Hono) essentials
- GET /schedule/plans?status=…&range=…&page=…
- POST /schedule/plans (create draft)
- GET /schedule/plans/:id (plan + activities + constraints)
- POST /schedule/plans/:id/activities (upsert)
- PATCH /schedule/activities/:id (dates/deps)
- POST /schedule/plans/:id/constraints (add)
- POST /schedule/plans/:id/notifications (draft)
- POST /schedule/plans/:id/approve (publish + events)

## Database (Prisma tables)
- schedules, schedule_activities, constraints, notification_drafts
- schedule_plans, schedule_items, schedule_item_resources
- resource_availability_windows, resource_unavailability
- schedule_constraints, constraint_violations
- schedule_generation_runs
- approval_requests, schedule_audit_log, schedule_outbox_events

## Guardrails
- Review/approval gates for plan publish and notifications
- Idempotent publish per (tenantId, planId)
- Outbox → EventLog; idempotent consumers