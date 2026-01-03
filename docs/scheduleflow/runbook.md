# Runbook — ScheduleFlow Operations

## Pre‑requisites
- DATABASE_URL reachable; Prisma migrations applied for schedule_* tables
- Feature flags: notifications delivery disabled unless approval flow is live
- Events Outbox worker running (outbox → event_log)

## Deploy checklist
1) Migrations: apply schedule tables and indices
2) Seed: optional sample plan/activities for smoke
3) Start API + workers; verify /dashboard/summary and /schedule/plans respond
4) Permissions: Owner/Scheduler can create drafts; Owner approves

## Operate
- Create draft: POST /schedule/plans (+ activities)
- Generate baseline: call generator (internal service) on draft
- Review constraints: add constraints; check violations list
- Approve plan: POST /schedule/plans/:id/approve → emits ScheduleGenerated.v1
- Draft notifications: POST /schedule/plans/:id/notifications; approve when ready

## Monitoring
- KPIs: plan approves/day, constraint violations count, notification approvals
- Telemetry: OTEL spans schedule.plans.*; Sentry for failures
- Logs: Outbox dead‑letter zero tolerance; alert on non‑empty queue

## Backfill / recovery
- Rebuild baseline safely by re‑running generator with the same inputs (idempotent snapshot)
- If approve fails after outbox write: worker will re‑deliver; check dead‑letters

## Rollback
- Revert to previous approved plan (keep drafts intact)
- Disable new approvals (feature flag) until issue resolved