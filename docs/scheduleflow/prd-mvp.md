# PRD — ScheduleFlow MVP: Baseline + Constraints + Notifications

## Overview
Deliver a lightweight scheduling module for small contractor crews. Generate a baseline plan from activities and dependencies, visualize it, capture constraints, and prepare notification drafts (approval-gated) for key dates/changes.

## Goals
- Create/maintain a project schedule with simple dependency management.
- Capture constraints (no-work dates, resource limits) and show violations.
- Draft outbound notifications (email/SMS) for milestone reminders; approvals required before send.

## Non-Goals (defer)
- Full Gantt with drag-resize and resource leveling; ICS sync; advanced auto-optimization.

## User stories
- As Owner, create a draft schedule from activity list with dependencies.
- As Scheduler, add constraints and see violations highlighted.
- As Owner, approve a notification draft to notify clients or crew.

## Web UI (Next.js)
- apps/web/src/app/scheduleflow/page.tsx (shell — list of plans)
- apps/web/src/app/scheduleflow/[planId]/page.tsx (detail — timeline view, constraints)
- Components:
  - packages/ui/src/components/schedule/PlanTimeline.tsx (basic timeline list)
  - packages/ui/src/components/schedule/ConstraintList.tsx
  - packages/ui/src/components/schedule/NotificationDrafts.tsx

## API (Hono)
- apps/api/src/routes/schedule.ts
  - POST /schedule/plans — create draft plan
  - GET /schedule/plans/:id — fetch plan + activities + constraints
  - POST /schedule/plans/:id/activities — add activities
  - PATCH /schedule/activities/:id — update activity (dates, deps)
  - POST /schedule/plans/:id/constraints — add constraint
  - POST /schedule/plans/:id/notifications — create notification draft
  - POST /schedule/plans/:id/approve — publish plan (approval gate)

Schemas (Zod):
- apps/api/src/schemas/schedule.ts — PlanCreate, ActivityUpsert, ConstraintCreate, NotificationDraftCreate

## Background workers (optional MVP)
- apps/api/src/jobs/processors/scheduleGenerate.ts — basic forward-pass baseline from deps

## DB models (mapped to existing tables)
- schedules, schedule_activities, constraints, notification_drafts
- schedule_generation_runs, approval_requests, schedule_audit_log

## Events
- ScheduleGenerated.v1, ScheduleChanged.v1

## Guardrails
- Drafts require approval before publish; drafts of notifications also approval-gated.
- Idempotent publishes per tenantId+planId.

## Acceptance Criteria
- Create plan with activities and dependencies; generator fills dates.
- Constraints display and violations listed.
- Notification drafts can be created and approved (no actual send yet).
- Events emitted on approve; entries in outbox present.

## Telemetry
- OTEL spans around generator and approve endpoints; PostHog schedule_generated, draft_created.