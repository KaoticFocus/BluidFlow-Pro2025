# ScheduleFlow — Code Skeletons

> **Last updated:** 2026-01-03

This document maps ScheduleFlow features to code locations and provides implementation stubs.

## File Structure

```
apps/
├── api/
│   └── src/
│       ├── routes/
│       │   └── scheduleflow.ts          # API routes
│       ├── lib/
│       │   ├── schemas/
│       │   │   └── scheduleflow.ts      # Zod schemas
│       │   └── services/
│       │       └── scheduleflow.ts      # Business logic
│       └── workers/
│           └── consumers/
│               └── scheduleflow-notifications.ts
└── web/
    └── app/
        └── (dashboard)/
            └── scheduleflow/
                ├── page.tsx             # List view
                ├── [id]/
                │   └── page.tsx         # Detail view
                └── new/
                    └── page.tsx         # Create form

components/
└── scheduleflow/
    ├── ScheduleList.tsx
    ├── ScheduleCard.tsx
    ├── ScheduleFilters.tsx
    ├── ScheduleForm.tsx
    └── ActivityList.tsx

packages/
└── db/
    └── prisma/
        └── schema.prisma                # Add schedule models
```

## API Layer

### Route Handler: `apps/api/src/routes/scheduleflow.ts`

```typescript
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { authMiddleware, tenantMiddleware } from '../middleware/auth';
import {
  ListSchedulesSchema,
  CreateScheduleSchema,
  UpdateScheduleSchema,
} from '../lib/schemas/scheduleflow';
import * as scheduleService from '../lib/services/scheduleflow';

const scheduleRouter = new Hono();

// Apply auth to all routes
scheduleRouter.use('*', authMiddleware, tenantMiddleware);

// GET /v1/schedules - List schedules
scheduleRouter.get('/', zValidator('query', ListSchedulesSchema), async (c) => {
  const auth = c.get('auth');
  const query = c.req.valid('query');
  
  // TODO: Implement permission check
  // requirePermission(auth, 'scheduleflow:read');
  
  const result = await scheduleService.listSchedules({
    orgId: auth.tenantId,
    ...query,
  });
  
  return c.json(result);
});

// POST /v1/schedules - Create schedule
scheduleRouter.post('/', zValidator('json', CreateScheduleSchema), async (c) => {
  const auth = c.get('auth');
  const body = c.req.valid('json');
  
  // TODO: Implement permission check
  // requirePermission(auth, 'scheduleflow:create');
  
  const schedule = await scheduleService.createSchedule({
    orgId: auth.tenantId,
    createdBy: auth.user.id,
    ...body,
  });
  
  return c.json(schedule, 201);
});

// GET /v1/schedules/:id - Get schedule detail
scheduleRouter.get('/:id', async (c) => {
  const auth = c.get('auth');
  const id = c.req.param('id');
  
  const schedule = await scheduleService.getSchedule({
    id,
    orgId: auth.tenantId,
  });
  
  if (!schedule) {
    return c.json({ error: 'Schedule not found' }, 404);
  }
  
  return c.json(schedule);
});

// POST /v1/schedules/:id/approve - Approve schedule
scheduleRouter.post('/:id/approve', async (c) => {
  const auth = c.get('auth');
  const id = c.req.param('id');
  
  // TODO: Implement permission check
  // requirePermission(auth, 'scheduleflow:approve');
  
  const result = await scheduleService.approveSchedule({
    id,
    orgId: auth.tenantId,
    approvedBy: auth.user.id,
  });
  
  return c.json(result);
});

export default scheduleRouter;
```

### Schemas: `apps/api/src/lib/schemas/scheduleflow.ts`

```typescript
import { z } from 'zod';

// Enums
export const ScheduleStatus = z.enum(['draft', 'pending', 'approved', 'rejected']);
export type ScheduleStatus = z.infer<typeof ScheduleStatus>;

// List query params
export const ListSchedulesSchema = z.object({
  status: z.string().optional(), // comma-separated
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['name', 'startAt', 'updatedAt', 'status']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
export type ListSchedulesInput = z.infer<typeof ListSchedulesSchema>;

// Create schedule
export const CreateScheduleSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  timezone: z.string().min(1).max(50).default('UTC'),
}).refine(
  (data) => new Date(data.endAt) > new Date(data.startAt),
  { message: 'End date must be after start date', path: ['endAt'] }
);
export type CreateScheduleInput = z.infer<typeof CreateScheduleSchema>;

// Update schedule
export const UpdateScheduleSchema = CreateScheduleSchema.partial();
export type UpdateScheduleInput = z.infer<typeof UpdateScheduleSchema>;

// Activity schemas
export const CreateActivitySchema = z.object({
  name: z.string().min(1).max(255),
  activityType: z.string().min(1).max(50),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  assignedUserId: z.string().uuid().optional(),
  assignedRoleId: z.string().uuid().optional(),
  location: z.string().max(255).optional(),
  notes: z.string().max(2000).optional(),
});
export type CreateActivityInput = z.infer<typeof CreateActivitySchema>;
```

### Service: `apps/api/src/lib/services/scheduleflow.ts`

```typescript
import { prisma } from '../prisma';
import { Prisma } from '@prisma/client';
import type { ListSchedulesInput, CreateScheduleInput } from '../schemas/scheduleflow';

export async function listSchedules(input: ListSchedulesInput & { orgId: string }) {
  const { orgId, status, from, to, search, page, pageSize, sortBy, sortOrder } = input;
  
  const where: Prisma.ScheduleWhereInput = {
    orgId,
    deletedAt: null,
  };
  
  // Status filter
  if (status) {
    const statuses = status.split(',').map((s) => s.trim());
    where.status = { in: statuses };
  }
  
  // Date range filter
  if (from) {
    where.startAt = { ...where.startAt, gte: new Date(from) };
  }
  if (to) {
    where.endAt = { ...where.endAt, lte: new Date(to) };
  }
  
  // Search filter
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }
  
  const [items, total] = await Promise.all([
    prisma.schedule.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { [sortBy]: sortOrder },
      include: {
        _count: { select: { activities: true } },
        activities: {
          select: { assignedUser: { select: { id: true, name: true, avatarUrl: true } } },
          take: 5,
        },
      },
    }),
    prisma.schedule.count({ where }),
  ]);
  
  return {
    items: items.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      startAt: s.startAt.toISOString(),
      endAt: s.endAt.toISOString(),
      timezone: s.timezone,
      status: s.status,
      activityCount: s._count.activities,
      assignedUsers: [...new Map(
        s.activities
          .filter((a) => a.assignedUser)
          .map((a) => [a.assignedUser!.id, a.assignedUser])
      ).values()].slice(0, 3),
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    })),
    page,
    pageSize,
    total,
    hasMore: page * pageSize < total,
  };
}

export async function createSchedule(
  input: CreateScheduleInput & { orgId: string; createdBy: string }
) {
  const schedule = await prisma.schedule.create({
    data: {
      orgId: input.orgId,
      name: input.name,
      description: input.description,
      startAt: new Date(input.startAt),
      endAt: new Date(input.endAt),
      timezone: input.timezone,
      status: 'draft',
      createdBy: input.createdBy,
    },
  });
  
  // TODO: Create audit log entry
  // await createAuditLog({ entityType: 'schedule', entityId: schedule.id, action: 'create', ... });
  
  return {
    id: schedule.id,
    name: schedule.name,
    status: schedule.status,
    createdAt: schedule.createdAt.toISOString(),
  };
}

export async function getSchedule(input: { id: string; orgId: string }) {
  const schedule = await prisma.schedule.findFirst({
    where: {
      id: input.id,
      orgId: input.orgId,
      deletedAt: null,
    },
    include: {
      activities: {
        orderBy: { startAt: 'asc' },
        include: {
          assignedUser: { select: { id: true, name: true, avatarUrl: true } },
        },
      },
      approvedByUser: { select: { id: true, name: true } },
      createdByUser: { select: { id: true, name: true } },
    },
  });
  
  if (!schedule) return null;
  
  return {
    id: schedule.id,
    name: schedule.name,
    description: schedule.description,
    startAt: schedule.startAt.toISOString(),
    endAt: schedule.endAt.toISOString(),
    timezone: schedule.timezone,
    status: schedule.status,
    approvedBy: schedule.approvedByUser,
    approvedAt: schedule.approvedAt?.toISOString(),
    activities: schedule.activities.map((a) => ({
      id: a.id,
      name: a.name,
      activityType: a.activityType,
      startAt: a.startAt.toISOString(),
      endAt: a.endAt.toISOString(),
      assignedUser: a.assignedUser,
    })),
    createdBy: schedule.createdByUser,
    createdAt: schedule.createdAt.toISOString(),
    updatedAt: schedule.updatedAt.toISOString(),
  };
}

export async function approveSchedule(input: { id: string; orgId: string; approvedBy: string }) {
  // TODO: Verify schedule is in 'pending' status
  // TODO: Implement approval logic
  // TODO: Queue notifications
  
  const schedule = await prisma.schedule.update({
    where: { id: input.id },
    data: {
      status: 'approved',
      approvedBy: input.approvedBy,
      approvedAt: new Date(),
    },
  });
  
  return {
    id: schedule.id,
    status: schedule.status,
    approvedAt: schedule.approvedAt?.toISOString(),
  };
}
```

## Web Layer

### Page: `apps/web/app/(dashboard)/scheduleflow/page.tsx`

```typescript
import { Suspense } from 'react';
import { ScheduleList } from '@/components/scheduleflow/ScheduleList';
import { ScheduleFilters } from '@/components/scheduleflow/ScheduleFilters';
import { ScheduleListSkeleton } from '@/components/scheduleflow/ScheduleListSkeleton';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ScheduleFlowPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ScheduleFlow</h1>
          <p className="text-slate-400">Manage project schedules</p>
        </div>
        <Link
          href="/scheduleflow/new"
          className="btn-primary"
        >
          New Schedule
        </Link>
      </div>

      {/* Filters */}
      <ScheduleFilters
        status={searchParams.status}
        from={searchParams.from}
        to={searchParams.to}
        search={searchParams.search}
      />

      {/* Schedule List */}
      <Suspense fallback={<ScheduleListSkeleton />}>
        <ScheduleList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
```

### Component: `components/scheduleflow/ScheduleCard.tsx`

```typescript
'use client';

import Link from 'next/link';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDateRange } from '@/lib/utils/date';

type ScheduleCardProps = {
  id: string;
  name: string;
  startAt: string;
  endAt: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  activityCount: number;
  assignedUsers: Array<{ id: string; name: string; avatarUrl?: string }>;
};

export function ScheduleCard({
  id,
  name,
  startAt,
  endAt,
  status,
  activityCount,
  assignedUsers,
}: ScheduleCardProps) {
  return (
    <Link
      href={`/scheduleflow/${id}`}
      className="card p-4 hover:border-slate-600 transition-all group"
      aria-label={`View ${name} schedule`}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-white group-hover:text-cyan-400 transition-colors truncate">
          {name}
        </h3>
        <StatusBadge status={status} />
      </div>
      
      <p className="text-sm text-slate-400 mb-3">
        {formatDateRange(startAt, endAt)}
      </p>
      
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500">
          {activityCount} {activityCount === 1 ? 'activity' : 'activities'}
        </span>
        
        {assignedUsers.length > 0 && (
          <div className="flex -space-x-2">
            {assignedUsers.slice(0, 3).map((user) => (
              <div
                key={user.id}
                className="w-6 h-6 rounded-full bg-slate-700 ring-2 ring-slate-900 flex items-center justify-center text-xs font-medium"
                title={user.name}
              >
                {user.name.charAt(0)}
              </div>
            ))}
            {assignedUsers.length > 3 && (
              <div className="w-6 h-6 rounded-full bg-slate-600 ring-2 ring-slate-900 flex items-center justify-center text-xs">
                +{assignedUsers.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
```

## Prisma Schema Additions

Add to `packages/db/prisma/schema.prisma`:

```prisma
model Schedule {
  id            String    @id @default(uuid())
  orgId         String    @map("org_id")
  name          String    @db.VarChar(255)
  description   String?   @db.Text
  startAt       DateTime  @map("start_at")
  endAt         DateTime  @map("end_at")
  timezone      String    @default("UTC") @db.VarChar(50)
  status        String    @default("draft") @db.VarChar(20)
  approvedBy    String?   @map("approved_by")
  approvedAt    DateTime? @map("approved_at")
  rejectionReason String? @map("rejection_reason") @db.Text
  createdBy     String    @map("created_by")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  deletedAt     DateTime? @map("deleted_at")

  // Relations
  organization  Organization @relation(fields: [orgId], references: [id])
  approvedByUser User?       @relation("ScheduleApprover", fields: [approvedBy], references: [id])
  createdByUser  User        @relation("ScheduleCreator", fields: [createdBy], references: [id])
  activities    ScheduleActivity[]
  notifications Notification[]
  constraints   Constraint[]

  @@index([orgId])
  @@index([status])
  @@index([startAt])
  @@map("schedules")
}

model ScheduleActivity {
  id              String    @id @default(uuid())
  scheduleId      String    @map("schedule_id")
  activityType    String    @map("activity_type") @db.VarChar(50)
  name            String    @db.VarChar(255)
  description     String?   @db.Text
  startAt         DateTime  @map("start_at")
  endAt           DateTime  @map("end_at")
  assignedUserId  String?   @map("assigned_user_id")
  assignedRoleId  String?   @map("assigned_role_id")
  location        String?   @db.VarChar(255)
  notes           String?   @db.Text
  color           String?   @db.VarChar(7)
  sortOrder       Int       @default(0) @map("sort_order")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  // Relations
  schedule      Schedule @relation(fields: [scheduleId], references: [id], onDelete: Cascade)
  assignedUser  User?    @relation(fields: [assignedUserId], references: [id])

  @@index([scheduleId])
  @@index([assignedUserId])
  @@map("schedule_activities")
}
```

## Mount Router

Add to `apps/api/src/index.ts`:

```typescript
import scheduleRouter from './routes/scheduleflow';

// ... existing routes ...

app.route('/v1/schedules', scheduleRouter);
```

<!-- TODO: Implement notification worker -->
<!-- TODO: Add constraint validation service -->
<!-- TODO: Create frontend tests -->
