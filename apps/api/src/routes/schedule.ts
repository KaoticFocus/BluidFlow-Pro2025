import { Hono } from "hono";
import type { Context } from "hono";
import { zValidator } from "@hono/zod-validator";
import { PlanFilterSchema, PlanCreateSchema, type Plan } from "../schemas/schedule";
import { generateSchedulePlan } from "../services/scheduleGenerate";

/**
 * Schedule API Routes
 * 
 * GET /schedule/plans - List schedule plans with filters
 * POST /schedule/plans - Create a new schedule plan
 * 
 * @todo Implement RBAC: requireRole('viewer') for GET, requireRole('manager') for POST
 * @todo Connect to database for persistence
 */
export const schedule = new Hono();

/**
 * Mock plans for development
 * @todo Replace with database queries
 */
const mockPlans: Plan[] = [
  {
    id: "plan_1",
    name: "Q1 2026 Foundation Phase",
    status: "approved",
    startsAt: "2026-01-15T08:00:00Z",
    endsAt: "2026-03-31T17:00:00Z",
  },
  {
    id: "plan_2",
    name: "Electrical Rough-In Schedule",
    status: "submitted",
    startsAt: "2026-02-01T08:00:00Z",
    endsAt: "2026-02-28T17:00:00Z",
  },
  {
    id: "plan_3",
    name: "HVAC Installation Timeline",
    status: "draft",
    startsAt: "2026-03-01T08:00:00Z",
  },
];

/**
 * GET /schedule/plans
 * 
 * Query params:
 * - status: 'draft' | 'submitted' | 'approved' (optional)
 * - from: ISO date string (optional)
 * - to: ISO date string (optional)
 * - page: number (default 1)
 * - pageSize: number (default 20, max 200)
 * 
 * @todo Add authGuard middleware when available
 * @todo Add requireRole('viewer') RBAC check
 */
schedule.get(
  "/plans",
  zValidator("query", PlanFilterSchema),
  async (c: Context) => {
    const query = c.req.valid("query" as never) as {
      status?: string;
      from?: string;
      to?: string;
      page?: number;
      pageSize?: number;
    };

    const { status, from, to, page = 1, pageSize = 20 } = query;

    // Filter mock data
    let filtered = [...mockPlans];

    if (status) {
      filtered = filtered.filter((p) => p.status === status);
    }

    if (from) {
      filtered = filtered.filter((p) => !p.startsAt || p.startsAt >= from);
    }

    if (to) {
      filtered = filtered.filter((p) => !p.endsAt || p.endsAt <= to);
    }

    // Paginate
    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    return c.json({
      items,
      page,
      pageSize,
      total,
    });
  }
);

/**
 * POST /schedule/plans
 * 
 * Body:
 * - name: string (required)
 * - startsAt: ISO date string (optional)
 * - endsAt: ISO date string (optional)
 * 
 * @todo Add authGuard middleware when available
 * @todo Add requireRole('manager') RBAC check
 * @todo Persist to database
 */
schedule.post(
  "/plans",
  zValidator("json", PlanCreateSchema),
  async (c: Context) => {
    const body = c.req.valid("json" as never) as {
      name: string;
      startsAt?: string;
      endsAt?: string;
    };

    // Use the service to generate the plan
    const plan = await generateSchedulePlan({
      name: body.name,
      startsAt: body.startsAt,
      endsAt: body.endsAt,
    });

    return c.json({ plan }, 201);
  }
);
