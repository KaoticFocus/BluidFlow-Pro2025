/**
 * Query Optimization Utilities
 * Provides helpers for optimizing database queries
 */

import { Prisma } from "@prisma/client";

/**
 * Build optimized where clause for task queries
 * Ensures tenant_id is always first for index usage
 */
export function buildTaskWhereClause(
  tenantId: string,
  filters: {
    status?: string;
    projectId?: string;
    source?: string;
    type?: string;
    priority?: string;
    assigneeId?: string;
    dueDate?: { lte?: Date; gte?: Date };
  }
): Prisma.TaskWhereInput {
  const where: Prisma.TaskWhereInput = {
    tenantId, // Always include tenantId first for index usage
  };

  if (filters.status) where.status = filters.status;
  if (filters.projectId) where.projectId = filters.projectId;
  if (filters.source) where.source = filters.source;
  if (filters.type) where.type = filters.type;
  if (filters.priority) where.priority = filters.priority;
  if (filters.assigneeId) where.assignedToId = filters.assigneeId;
  if (filters.dueDate) {
    where.dueDate = {};
    if (filters.dueDate.lte) where.dueDate.lte = filters.dueDate.lte;
    if (filters.dueDate.gte) where.dueDate.gte = filters.dueDate.gte;
  }

  return where;
}

/**
 * Optimize daily plan generation query
 * Uses composite indexes for efficient filtering
 */
export function buildDailyPlanTaskQuery(
  planDate: Date,
  projectId?: string
): Prisma.TaskWhereInput {
  const baseWhere: Prisma.TaskWhereInput = {
    tenantId,
    type: { not: "checklist_item" }, // Exclude checklist items
  };

  if (projectId) {
    baseWhere.projectId = projectId;
  }

  // Use OR conditions optimized for index usage
  return {
    ...baseWhere,
    OR: [
      // Tasks due on or before plan date (uses tenantId, status, dueDate index)
      {
        status: { in: ["open", "in_progress"] },
        dueDate: { lte: planDate },
      },
      // Recent approved AI tasks (uses tenantId, status, createdAt index)
      {
        status: "open",
        aiGenerated: true,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      // Backlog items (uses tenantId, status index)
      {
        status: "open",
        dueDate: null,
      },
    ],
  };
}

/**
 * Select minimal fields for list views
 * Reduces payload size and improves performance
 */
export const taskListSelect = {
  id: true,
  tenantId: true,
  projectId: true,
  source: true,
  type: true,
  status: true,
  title: true,
  description: true,
  priority: true,
  dueDate: true,
  assignedToId: true,
  aiGenerated: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.TaskSelect;

/**
 * Select minimal fields for event log queries
 */
export const eventLogListSelect = {
  sequence: true,
  eventId: true,
  tenantId: true,
  schemaId: true,
  schemaVersion: true,
  headers: true,
  payloadRedacted: true,
  payloadHash: true,
  publishedAt: true,
} satisfies Prisma.EventLogSelect;

