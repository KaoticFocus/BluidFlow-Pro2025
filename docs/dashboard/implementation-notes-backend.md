# /dashboard/summary — Backend Implementation Notes (Hono + Prisma + Zod)

## File paths
- Route: apps/api/src/routes/dashboard.ts
- Service: apps/api/src/services/dashboardSummary.ts
- Schemas: apps/api/src/schemas/dashboard.ts
- Auth/RBAC: apps/api/src/lib/auth.ts (authGuard + rbac("dashboard:view"))

## Zod Schemas (apps/api/src/schemas/dashboard.ts)
```ts
import { z } from 'zod';

export const SummaryQuery = z.object({
  range: z.enum(["1d","7d","30d","90d"]).default("7d"),
  include: z
    .string()
    .transform(v => (v ? v.split(",") : ["kpis","charts","recent"]))
    .optional(),
  recentLimit: z.coerce.number().min(1).max(10).default(5),
  tz: z.string().optional(), // IANA, default from user or UTC
});

export const SummaryResponse = z.object({
  kpis: z
    .object({
      tasksOverdue: z.number(),
      tasksDueToday: z.number(),
      leadsNew: z.number(),
      meetingsReviewPending: z.number(),
      aiActionsNeedsReview: z.number().nullable(), // null if not permitted
    })
    .optional(),
  charts: z
    .object({
      tasksByStatus: z.array(z.object({ label: z.string(), count: z.number() })),
      leadsByDay: z.array(z.object({ date: z.string(), count: z.number() })),
    })
    .optional(),
  recent: z
    .object({
      tasks: z.array(
        z.object({ id: z.string(), title: z.string(), status: z.string(), dueDate: z.string().nullable().optional() })
      ),
      leads: z.array(z.object({ id: z.string(), title: z.string(), createdAt: z.string() })),
      meetings: z.array(z.object({ id: z.string(), title: z.string(), status: z.string().nullable().optional() })),
    })
    .optional(),
  meta: z.object({ range: z.string(), generatedAt: z.string(), tz: z.string().optional() }),
});
```

## Route (apps/api/src/routes/dashboard.ts)
```ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { SummaryQuery, SummaryResponse } from '../schemas/dashboard';
import { authGuard, rbac } from '../lib/auth';
import { fetchSummary } from '../services/dashboardSummary';

export const dashboard = new Hono();
dashboard.use('*', authGuard());

dashboard.get('/summary', zValidator('query', SummaryQuery), rbac('dashboard:view'), async (c) => {
  const user = c.var.user as { tenantId: string; role: string };
  const q = c.req.valid('query');
  const data = await fetchSummary({ tenantId: user.tenantId, role: user.role, ...q });
  return c.json(SummaryResponse.parse(data));
});

export default dashboard;
```

## Service skeleton (apps/api/src/services/dashboardSummary.ts)
```ts
import { prisma } from '@packages/db';
import { startOfToday, endOfToday, subDays, formatISO } from './time'; // implement helpers as needed

type Args = { tenantId: string; role: string; range?: '1d'|'7d'|'30d'|'90d'; include?: string[]; recentLimit?: number; tz?: string };

export async function fetchSummary({ tenantId, role, range = '7d', include = ['kpis','charts','recent'], recentLimit = 5 }: Args) {
  const now = new Date();
  const from = subDays(now, range === '1d' ? 1 : range === '7d' ? 7 : range === '30d' ? 30 : 90);

  const want = (key: 'kpis'|'charts'|'recent') => include.includes(key);

  const queries: Array<Promise<any>> = [];
  const out: any = { meta: { range, generatedAt: formatISO(now) } };

  if (want('kpis')) {
    queries.push(
      (async () => {
        const [tasksOverdue, tasksDueToday, leadsNew, meetingsReviewPending] = await Promise.all([
          prisma.task.count({ where: { tenantId, status: 'TODO', dueDate: { lt: endOfToday(now) } } }),
          prisma.task.count({ where: { tenantId, status: { in: ['TODO','IN_PROGRESS'] }, dueDate: { gte: startOfToday(now), lte: endOfToday(now) } } }),
          prisma.lead.count({ where: { tenantId, createdAt: { gte: from } } }),
          prisma.meeting.count({ where: { tenantId, status: 'review_pending' } }),
        ]);
        const aiActionsNeedsReview = (role === 'OWNER' || role === 'ADMIN')
          ? await prisma.aIActionLog.count({ where: { tenantId, needsReview: true } })
          : null;
        out.kpis = { tasksOverdue, tasksDueToday, leadsNew, meetingsReviewPending, aiActionsNeedsReview };
      })()
    );
  }

  if (want('charts')) {
    queries.push(
      (async () => {
        const tasksByStatusRaw = await prisma.task.groupBy({
          by: ['status'],
          where: { tenantId },
          _count: { _all: true },
        });
        const tasksByStatus = tasksByStatusRaw.map(r => ({ label: r.status, count: r._count._all }));
        const leadsByDay = await prisma.$queryRawUnsafe<{ date: string; count: number }[]>(
          `select to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as date, count(*)::int as count
           from leads where tenant_id = $1 and created_at >= $2
           group by 1 order by 1`, tenantId, from
        );
        out.charts = { tasksByStatus, leadsByDay };
      })()
    );
  }

  if (want('recent')) {
    queries.push(
      (async () => {
        const [tasks, leads, meetings] = await Promise.all([
          prisma.task.findMany({ where: { tenantId }, orderBy: { updatedAt: 'desc' }, select: { id: true, title: true, status: true, dueDate: true }, take: recentLimit }),
          prisma.lead.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' }, select: { id: true, title: true, createdAt: true }, take: recentLimit }),
          prisma.meeting.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' }, select: { id: true, title: true, status: true }, take: recentLimit }),
        ]);
        out.recent = { tasks, leads, meetings };
      })()
    );
  }

  await Promise.all(queries);
  return out;
}
```

## Deep‑link mappings (frontend expects)
- tasksOverdue → /tasks?status=overdue
- tasksDueToday → /tasks?due=today
- leadsNew → /leads?range={range}&stage=new
- meetingsReviewPending → /meetings?status=review_pending
- aiActionsNeedsReview → /admin/ai-actions?needsReview=true

## Performance & Ops
- Verify indices on tasks/leads/meetings/ai_action_log
- Cache KPIs/charts briefly (15–60s); rate-limit endpoint
- Telemetry: OTEL span name "dashboard.summary" with key attributes

## Errors & RBAC
- Zod 400s, 401/403 for auth, 500 w/ correlation id
- Hide AI actions KPI for non‑Owner/Admin (return null)

## Tests
- Unit: aggregation math and windows
- Integration: include flags and recentLimit honored
- Perf: p95 < 800ms typical tenant
