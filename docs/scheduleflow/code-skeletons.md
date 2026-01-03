## ScheduleFlow Home — Code Skeletons (web + api + zod + components)

### Web (Next.js) — apps/web/src/app/scheduleflow/page.tsx
```tsx
import Link from 'next/link';
import { Suspense } from 'react';

export default async function ScheduleFlowHome({ searchParams }: { searchParams: { status?: string; range?: string } }) {
  const status = searchParams.status ?? 'approved';
  const range = searchParams.range ?? '90d';
  // TODO: fetch plans via API using status/range
  const plans: Array<{ id: string; title: string; status: string; startDate?: string; endDate?: string; violationsCount?: number }> = [];

  return (
    <main className="p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Schedule Plans</h1>
        <div className="flex gap-2">
          <Link className="btn" href="/scheduleflow?status=draft">Drafts</Link>
          <Link className="btn" href="/scheduleflow?status=approved">Latest</Link>
          <button className="btn">New Plan</button>
        </div>
      </header>
      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map(p => (
          <Link key={p.id} href={`/scheduleflow/${p.id}`} aria-label={`Open plan ${p.title}`} className="rounded border p-4 hover:bg-muted">
            <div className="font-medium">{p.title}</div>
            <div className="mt-1 text-sm text-muted-foreground">{p.status}{p.violationsCount ? ` • Violations ${p.violationsCount}` : ''}</div>
            <div className="text-xs text-muted-foreground">{p.startDate} → {p.endDate}</div>
          </Link>
        ))}
      </section>
    </main>
  );
}
```

### API (Hono) — apps/api/src/routes/schedule.ts
```ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { PlanListQuery, PlanCreate } from '../schemas/schedule';
import { authGuard, rbac } from '../lib/auth';

export const schedule = new Hono();
schedule.use('*', authGuard());

// GET /schedule/plans
schedule.get('/plans', zValidator('query', PlanListQuery), rbac('schedule:read'), async (c) => {
  const q = c.req.valid('query');
  // TODO: prisma.schedules findMany with filters + pagination
  return c.json({ items: [], page: q.page ?? 1, pageSize: q.pageSize ?? 20, total: 0 });
});

// POST /schedule/plans
schedule.post('/plans', zValidator('json', PlanCreate), rbac('schedule:create'), async (c) => {
  const body = c.req.valid('json');
  // TODO: create draft plan, optional seed activities
  return c.json({ id: 'plan_x', status: 'draft' }, 201);
});

export default schedule;
```

### Zod Schemas — apps/api/src/schemas/schedule.ts
```ts
import { z } from 'zod';
export const PlanListQuery = z.object({
  status: z.enum(['draft','pending_approval','approved','archived']).optional(),
  range: z.enum(['30d','90d','all']).optional(),
  page: z.coerce.number().min(1).optional(),
  pageSize: z.coerce.number().min(1).max(100).optional(),
});
export const PlanCreate = z.object({
  title: z.string().min(1),
  startDate: z.string().date().optional(),
  seedActivities: z.array(z.object({ id: z.string().optional(), title: z.string(), durationDays: z.number().int().min(1), predecessors: z.array(z.string()).optional() })).optional(),
});
```
