import { Hono } from "hono";
import type { Context } from "hono";

/**
 * Dashboard API Routes
 * 
 * GET /dashboard/summary - Returns KPI counts and timestamps for dashboard tiles
 * 
 * @todo Implement RBAC: requireRole('viewer') middleware
 * @todo Fetch real metrics from database/services
 */
export const dashboard = new Hono();

/**
 * Dashboard Summary Response Shape
 */
interface DashboardSummary {
  tasks: {
    overdue: number;
    dueToday: number;
    inProgress: number;
  };
  schedule: {
    upcomingPlans: number;
    approved: number;
  };
  updatedAt: string;
}

/**
 * GET /dashboard/summary
 * 
 * Returns aggregated KPI data for dashboard tiles.
 * Each KPI links to a filtered list view.
 * 
 * @todo Add authGuard middleware when available
 * @todo Add requireRole('viewer') RBAC check
 */
dashboard.get("/summary", async (c: Context) => {
  // TODO: Replace with real DB queries
  // Example: const tasksOverdue = await prisma.task.count({ where: { status: 'overdue', tenantId } });
  
  const summary: DashboardSummary = {
    tasks: {
      overdue: 7,      // Links to /tasks?status=overdue
      dueToday: 5,     // Links to /tasks?due=today
      inProgress: 12,  // Links to /tasks?status=in_progress
    },
    schedule: {
      upcomingPlans: 3,  // Links to /scheduleflow?status=draft
      approved: 8,       // Links to /scheduleflow?status=approved
    },
    updatedAt: new Date().toISOString(),
  };

  return c.json(summary);
});
