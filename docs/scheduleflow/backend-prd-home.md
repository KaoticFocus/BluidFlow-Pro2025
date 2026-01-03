# Backend PRD — ScheduleFlow Home Screen

## Overview
Provide list and create endpoints used by the ScheduleFlow home: fetch plans by status/date and start a new baseline plan draft. Enforce tenant scoping and RBAC.

## Endpoints (Hono)
- GET /schedule/plans
  - Query: { status?, range?, page=1, pageSize=20, violationsOnly? }
  - Returns: { items:[{ id,title,status,startDate,endDate,violationsCount }], page, pageSize, total }
- POST /schedule/plans (create draft)
  - Body: { title, startDate?, seedActivities?: Activity[] }
  - Returns: { id, status:'draft' }
- GET /schedule/plans/latest?status=approved (shortcut for home CTA)

## Zod Schemas
- apps/api/src/schemas/schedule.ts — PlanListQuery, PlanListResponse, PlanCreate

## RBAC & Tenancy
- Owner/Scheduler: can create drafts; Owner can approve (handled on detail screen).
- Field: read-only.
- All queries must filter by tenantId.

## Indices & Performance
- schedules: (tenant_id,status), (tenant_id,updated_at desc)
- constraints/violations joins optimized; violationsCount computed cheaply via materialized count or aggregate.

## Observability
- OTEL spans: schedule.plans.list, schedule.plans.create; Sentry guards.

## Acceptance Criteria
- List filters and pagination work; creation returns a draft plan id; role restrictions enforced.