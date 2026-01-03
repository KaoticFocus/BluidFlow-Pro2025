import { prisma } from "./prisma";
import type { HomeSummary } from "./schemas/home";

/**
 * In-memory cache for home summary
 * TTL: 10-30 seconds per tenant
 */
interface CacheEntry {
  data: HomeSummary;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 15_000; // 15 seconds

/**
 * Get cached summary or compute fresh
 */
function getCached(cacheKey: string): HomeSummary | null {
  const entry = cache.get(cacheKey);
  if (entry && Date.now() < entry.expiresAt) {
    return entry.data;
  }
  cache.delete(cacheKey);
  return null;
}

/**
 * Set cache entry
 */
function setCache(cacheKey: string, data: HomeSummary): void {
  cache.set(cacheKey, {
    data,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

/**
 * Module access permissions
 * Maps module to required permission key
 */
const MODULE_PERMISSIONS: Record<string, string> = {
  tasks: "taskflow:read",
  meetings: "meetingflow:read",
  leads: "leads:read",
  schedule: "scheduleflow:read",
  timeclock: "timeclock:read",
  documents: "documents:read",
  ai: "ai_actions:read",
};

/**
 * Check if user can access a module
 */
function canAccessModule(permissions: Set<string>, module: string): boolean {
  const required = MODULE_PERMISSIONS[module];
  if (!required) return true; // Unknown module, allow by default
  return permissions.has(required);
}

/**
 * Get home summary for a user/tenant
 * 
 * @param tenantId - Tenant ID from auth context
 * @param userId - User ID from auth context
 * @param permissions - User permissions set
 * @returns HomeSummary with only authorized modules
 */
export async function getHomeSummary(
  tenantId: string,
  userId: string,
  permissions: Set<string>
): Promise<HomeSummary> {
  const cacheKey = `${tenantId}:${userId}`;
  
  // Check cache first
  const cached = getCached(cacheKey);
  if (cached) {
    return cached;
  }

  // Build summary with parallel queries
  const summary: HomeSummary = {
    updatedAt: new Date().toISOString(),
  };

  const queries: Promise<void>[] = [];

  // Tasks summary
  if (canAccessModule(permissions, "tasks")) {
    queries.push(
      (async () => {
        try {
          const [openCount, overdueCount] = await Promise.all([
            prisma.task.count({
              where: { tenantId, status: { in: ["TODO", "IN_PROGRESS"] } },
            }),
            prisma.task.count({
              where: {
                tenantId,
                status: { in: ["TODO", "IN_PROGRESS"] },
                dueDate: { lt: new Date() },
              },
            }),
          ]);
          summary.tasks = { open: openCount, overdue: overdueCount };
        } catch {
          // Module not available or error, skip
        }
      })()
    );
  }

  // Meetings summary
  if (canAccessModule(permissions, "meetings")) {
    queries.push(
      (async () => {
        try {
          const [upcomingCount, pendingReviewCount] = await Promise.all([
            prisma.meeting.count({
              where: { tenantId, scheduledAt: { gte: new Date() } },
            }),
            prisma.meeting.count({
              where: { tenantId, status: "REVIEW_PENDING" },
            }),
          ]);
          summary.meetings = { upcoming: upcomingCount, pending_review: pendingReviewCount };
        } catch {
          // Module not available or error, skip
        }
      })()
    );
  }

  // AI Actions summary
  if (canAccessModule(permissions, "ai")) {
    queries.push(
      (async () => {
        try {
          const pendingCount = await prisma.aIAction.count({
            where: { tenantId, status: "PENDING" },
          });
          summary.ai = { pending_review: pendingCount };
        } catch {
          // Module not available or error, skip
        }
      })()
    );
  }

  // TODO: Add leads, schedule, timeclock, documents queries
  // These require the respective Prisma models to exist
  
  // Leads summary (stub - model may not exist yet)
  if (canAccessModule(permissions, "leads")) {
    summary.leads = { new: 0 }; // TODO: Implement when Lead model exists
  }

  // Schedule summary (stub)
  if (canAccessModule(permissions, "schedule")) {
    summary.schedule = { upcoming_plans: 0 }; // TODO: Implement when SchedulePlan model exists
  }

  // Timeclock summary (stub)
  if (canAccessModule(permissions, "timeclock")) {
    summary.timeclock = { active_sessions: 0 }; // TODO: Implement when TimeEntry model exists
  }

  // Documents summary (stub)
  if (canAccessModule(permissions, "documents")) {
    summary.documents = { pending: 0 }; // TODO: Implement when Document model exists
  }

  await Promise.all(queries);

  // Cache the result
  setCache(cacheKey, summary);

  return summary;
}

/**
 * Clear cache for a tenant (call when data changes)
 */
export function invalidateHomeSummaryCache(tenantId: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(`${tenantId}:`)) {
      cache.delete(key);
    }
  }
}