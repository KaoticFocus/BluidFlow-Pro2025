# Frontend PRD — App Dashboard

## Overview
The App Dashboard is the signed-in landing page that surfaces high‑value KPIs, recent activity, and shortcuts across BuildFlow Pro modules. Every piece of information must act as a link that drills into a deeper, filtered view (see Drill‑down Rules).

Goals
- Provide a crisp overview in <2s TTI on mid‑tier devices
- Make all KPIs, charts, and list items actionable via deep links
- Track click‑through telemetry for product analytics

Out of scope (v1)
- Heavy visualization (Gantt charts); stick to lightweight cards and simple charts
- Cross‑tenant/global admin analytics

## User stories
- As an Owner, I see today’s priority signals and can jump directly to Overdue Tasks or Pending Reviews with one tap.
- As Sales, I can click New Leads to open a pre‑filtered Leads list for the last 7 days.
- As a Field Lead, I can open Today’s Plan and jump to Tasks due today.

## Information Architecture & Routes
Primary route (web):
- /apps/web/src/app/(app)/dashboard/page.tsx (default authed landing)
  - Consider alias: redirect /apps/web/src/app/(app)/page.tsx → /dashboard

Deep links (examples):
- Tasks: /apps/web/src/app/(app)/tasks/page.tsx with query support (?status=overdue|in_progress&due=today)
- Leads: /apps/web/src/app/(app)/leads/page.tsx (?range=7d|30d&stage=new)
- Meetings: /apps/web/src/app/(app)/meetings/page.tsx (?status=review_pending)
- AI Actions: /apps/web/src/app/(app)/admin/ai-actions/page.tsx (?needsReview=true)

## Components (packages/ui)
- DashboardKPICard.tsx — clickable card with title, value, delta, aria‑label; entire card acts as a Link
- DashboardChartCard.tsx — small bar/line/pie; segment clicks emit telemetry and navigate
- DashboardList.tsx — list of items (leads/tasks/meetings) with each row as a Link
- SectionHeader.tsx — title + optional subtitle + "View all" Link
- EmptyState.tsx — lightweight placeholder with CTA

Recommended file paths
- packages/ui/src/components/dashboard/DashboardKPICard.tsx
- packages/ui/src/components/dashboard/DashboardChartCard.tsx
- packages/ui/src/components/dashboard/DashboardList.tsx
- packages/ui/src/components/dashboard/SectionHeader.tsx

## Drill‑down Rules (must‑have)
- Every KPI card navigates to a relevant list view pre‑filtered to its context
- Every chart segment supports drill‑through to a filtered detail
- Every list row navigates to its entity detail view
- Each section provides a visible "View all" deep link
- All links are keyboard‑reachable and mobile tap targets ≥ 44×44px

Example mappings
- Overdue Tasks (N) → /tasks?status=overdue
- Tasks Due Today (N) → /tasks?due=today
- New Leads (7d) (N) → /leads?range=7d&stage=new
- Meetings awaiting review (N) → /meetings?status=review_pending
- AI Actions needing review (N) → /admin/ai-actions?needsReview=true

## Data & API Contracts (read‑only for v1)
Approach: thin /dashboard aggregation endpoint or compose existing endpoints via parallel queries.

Option A — Aggregation route
- GET /apps/api/src/routes/dashboard.ts → /dashboard/summary
  Response (example):
  {
    "kpis": {
      "tasksOverdue": 7,
      "tasksDueToday": 5,
      "leadsNew7d": 12,
      "meetingsReviewPending": 3,
      "aiActionsNeedsReview": 4
    },
    "charts": {
      "tasksByStatus": [ {"label":"Todo","count":18}, {"label":"In Progress","count":9}, {"label":"Done","count":27} ],
      "leads7d": [ {"date":"2026-01-01","count":2}, ... ]
    },
    "recent": {
      "tasks": [ {"id":"tsk_1","title":"Send material samples","status":"TODO","dueDate":"2026-01-04"}, ... ],
      "leads": [ {"id":"lead_1","title":"Kitchen remodel inquiry","createdAt":"2026-01-02"}, ... ],
      "meetings": [ {"id":"mtg_1","title":"Initial consult","status":"review_pending"}, ... ]
    }
  }

Option B — Compose existing endpoints (tanstack‑query on web)
- GET /tasks?summary=1; GET /leads?summary=1&range=7d; GET /meetings?status=review_pending&limit=5; GET /ai/actions?needsReview=true&limit=1

## State & Caching (tanstack‑query)
- Keys: ['dashboard','kpis']; ['dashboard','charts']; ['dashboard','recent','tasks'|'leads'|'meetings']
- staleTime: 30–60s for KPIs; 5m for charts; 15–30s for recents
- Background refetch on focus

## Navigation & Link Semantics
- Use Next.js Link; full card clickable with role="link" and descriptive aria‑label (e.g., "Open Overdue Tasks list (7)")
- Include query params to pre‑filter destination pages; those pages must respect and display active filters

## Telemetry & Analytics
Events (PostHog):
- dashboard.viewed { kpisShown: string[], ts }
- dashboard.kpi_clicked { kpi: 'tasksOverdue'|'tasksDueToday'|'leadsNew7d'|'meetingsReviewPending'|'aiActionsNeedsReview', value: number }
- dashboard.chart_drilldown { chart: 'tasksByStatus'|'leads7d', segment: string, value: number }
- dashboard.list_clicked { list: 'tasks'|'leads'|'meetings', id: string }

OpenTelemetry: span around aggregation fetch (if server‑side)

## Accessibility
- All KPI cards and chart segments must be reachable by keyboard (tab order)
- aria‑labels must describe destination and count
- Focus states visible; color contrast AA at minimum
- Provide text alternatives for charts (summary text)

## Responsive & Mobile (required)
- Mobile‑first; cards stack in a single column; charts collapse to simple bars/mini‑sparks
- Tap targets ≥ 44×44px; safe‑area padding; use 100dvh where applicable
- No horizontal scroll at 360px width

## Error/Empty States
- Empty lists → EmptyState with a CTA (e.g., "Create a task")
- API failures → inline non‑blocking error and Retry

## File paths (web)
- Page: /apps/web/src/app/(app)/dashboard/page.tsx
- Hooks: /apps/web/src/app/(app)/dashboard/useDashboardData.ts (query composition)
- Components: packages/ui/src/components/dashboard/* (KPICard, ChartCard, List, SectionHeader)

## Security & RBAC
- Dashboard is authed; content scoped to tenant
- Show/hide sections based on role (e.g., AI Actions section only for Owner/Admin)

## Performance Targets
- TTI < 2s (mid‑tier mobile); Lighthouse Mobile Perf ≥ 80, A11y ≥ 90
- Use suspense/streaming where helpful; avoid heavy charts in v1

## QA & Testing
- Unit: KPI/link mapping, query hooks
- Integration: clicking KPIs navigates with correct filters; telemetry fired
- E2E: unauth → redirect to sign‑in → land on /dashboard post‑login (preserve ?next)
- Devices: iPhone 12/14 Safari, Pixel 6 Chrome; portrait/landscape; no horizontal scroll

## Acceptance Criteria
- Every KPI, chart segment, and recent list item is clickable and navigates to a deeper view with matching filters
- "View all" link present per section
- Telemetry events captured for KPI and chart clicks with context
- A11y and mobile targets met (tap size, focus, contrast; no 360px overflow)
