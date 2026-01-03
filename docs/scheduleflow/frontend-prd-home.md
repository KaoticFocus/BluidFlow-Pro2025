# Frontend PRD — ScheduleFlow Home Screen

## Overview
Implement the /scheduleflow module home to list schedule plans with filters, New Plan action, and a shortcut to the latest approved plan.

## Routes & Files
- Page: /apps/web/src/app/scheduleflow/page.tsx
- Components:
  - packages/ui/src/components/schedule/PlanRow.tsx (mobile card row)
  - packages/ui/src/components/schedule/PlanFilters.tsx (status/date-range/violations)
  - packages/ui/src/components/schedule/NewPlanDialog.tsx

## Filters & Query Params
- status: draft|pending_approval|approved|archived
- range: 30d|90d|all (created/updated window)
- violations: boolean (badge indicator)

## UX Requirements
- Mobile-first card list; plan row shows name, status chip, date span, violations badge.
- Actions: "New Plan" (opens baseline generator dialog) for permitted roles; "View latest plan" quick link.
- Row click → /scheduleflow/[planId] (detail timeline view).

## RBAC
- Owner: can create plans and approve.
- Scheduler (if present) or Sales: can create/edit drafts; cannot approve.
- Field: read-only.

## Accessibility & Mobile
- Tap targets ≥ 44×44px; no 360px overflow; safe-area paddings.

## Telemetry
- schedule.home.viewed, schedule.plan.opened, schedule.plan.create_opened

## Acceptance Criteria
- Lists and filters function; deep-linking respected; role-based action visibility; navigation to plan detail works.