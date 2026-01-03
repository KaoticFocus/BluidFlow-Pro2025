# Backend PRD — App Dashboard (/dashboard/summary API)

## Overview
Tenant‑scoped aggregation endpoint returning KPIs, light charts, and recent items for the dashboard. Optimized for fast render and drill‑down deep links.

Route: GET /dashboard/summary

## Goals
- Single round‑trip for dashboard data
- Strict tenant scoping + RBAC
- Stable JSON schema; section toggles via query

## Request
- Query:
  - range: 1d|7d|30d|90d (default 7d)
  - include: kpis,charts,recent (comma‑sep; default all)
  - recentLimit: 1..10 (default 5)
  - tz: IANA timezone (default user tz or UTC)

Example: /dashboard/summary?range=7d&include=kpis,charts,recent&recentLimit=5&tz=America/New_York

## Response (shape)
```
{
  kpis: {
    tasksOverdue: number,
    tasksDueToday: number,
    leadsNew: number,
    meetingsReviewPending: number,
    aiActionsNeedsReview: number
  },
  charts: {
    tasksByStatus: [{ label: string, count: number }],
    leadsByDay:   [{ date: YYYY-MM-DD, count: number }]
  },
  recent: {
    tasks:    [{ id, title, status, dueDate? }],
    leads:    [{ id, title, createdAt }],
    meetings: [{ id, title, status? }]
  },
  meta: { range, generatedAt, tz }
}
```

## Data sources (read‑only)
- Tasks: overdue, dueToday, byStatus; recent tasks
- Leads: new in range; per‑day series; recent leads
- Meetings: review_pending count; recent meetings
- AI Actions: needsReview count (Owner/Admin only)

## RBAC & tenancy
- All queries filtered by tenantId
- Hide AI Actions unless role ∈ {Owner, Admin}

## Zod Schemas (apps/api/src/schemas/dashboard.ts)
- SummaryQuery: { range, include?, recentLimit?, tz? }
- SummaryResponse: matches response shape above

## Files (API)
- Route: apps/api/src/routes/dashboard.ts (GET /dashboard/summary)
- Service: apps/api/src/services/dashboardSummary.ts
- Auth/RBAC: apps/api/src/lib/auth.ts
- Schemas: apps/api/src/schemas/dashboard.ts

## Handler (sketch)
```ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { SummaryQuery, SummaryResponse } from '../schemas/dashboard';
import { authGuard, rbac } from '../lib/auth';
import { fetchSummary } from '../services/dashboardSummary';

export const dashboard = new Hono();
dashboard.use('*', authGuard());

dashboard.get('/summary', zValidator('query', SummaryQuery), rbac('dashboard:view'), async (c) => {
  const user = c.var.user;
  const q = c.req.valid('query');
  const data = await fetchSummary({ tenantId: user.tenantId, user, ...q });
  return c.json(SummaryResponse.parse(data));
});
```

## Service composition
- Respect include flags; parallelize queries (Promise.all)
- Time window from range + tz
- Return minimal fields for recents (detail pages fetch full data)

## Indices & performance
- tasks: (tenant_id,status), (tenant_id,due_date), (tenant_id,updated_at DESC)
- leads: (tenant_id,created_at DESC), (tenant_id,stage)
- meetings: (tenant_id,status), (tenant_id,created_at DESC)
- ai_action_log: (tenant_id,needs_review)
Targets: p95 < 800ms; DB P99 < 300ms across subqueries

## Caching & limits
- Cache KPIs/charts 15–60s per tenant (in‑memory); private Cache‑Control: max‑age=30
- Rate limit: 30 req/min/user; burst 10; 429 on breach

## Errors
- 400 invalid query (Zod)
- 401/403 unauth/forbidden
- 500 with correlationId

## Telemetry
- OTEL span: dashboard.summary { tenantId, range, sections, recentLimit }
- Counters: dashboard.summary.ok/error; SLO 99% < 1.5s

## Deep‑link mappings (frontend)
- tasksOverdue → /tasks?status=overdue
- tasksDueToday → /tasks?due=today
- leadsNew → /leads?range={range}&stage=new
- meetingsReviewPending → /meetings?status=review_pending
- aiActionsNeedsReview → /admin/ai-actions?needsReview=true

## Acceptance
- Honors include/recentLimit; tenant scoping & RBAC; telemetry emitted; response powers dashboard drill‑downs
