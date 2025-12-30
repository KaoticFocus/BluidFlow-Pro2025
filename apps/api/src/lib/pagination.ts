/**
 * Mobile-first pagination utilities
 * Provides cursor-based pagination for efficient mobile data loading
 */

import type { Context } from "hono";

export interface PaginationParams {
  cursor?: string;
  limit: number;
  maxLimit: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Parse pagination parameters from request query
 * Default limit: 20 (mobile-optimized)
 * Max limit: 100
 */
export function parsePagination(c: Context, defaultLimit = 20, maxLimit = 100): PaginationParams {
  const cursor = c.req.query("cursor") || undefined;
  const limitParam = c.req.query("limit");
  const limit = Math.min(
    limitParam ? parseInt(limitParam, 10) : defaultLimit,
    maxLimit
  );
  
  return { cursor, limit, maxLimit };
}

/**
 * Create a paginated response from items
 * @param items - All items fetched (may be one more than limit to check hasMore)
 * @param limit - Requested limit
 * @param getCursor - Function to extract cursor from an item (typically returns item.id)
 */
export function createPaginatedResponse<T>(
  items: T[],
  limit: number,
  getCursor: (item: T) => string
): PaginatedResponse<T> {
  const hasMore = items.length > limit;
  const result = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore && result.length > 0 
    ? getCursor(result[result.length - 1]) 
    : null;
  
  return {
    items: result,
    nextCursor,
    hasMore,
  };
}

/**
 * Build Prisma cursor for pagination
 */
export function buildCursor(cursor?: string): { id: string } | undefined {
  return cursor ? { id: cursor } : undefined;
}

