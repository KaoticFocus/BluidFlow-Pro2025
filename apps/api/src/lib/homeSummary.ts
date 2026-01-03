import type { HomeSummaryResponse } from "./schemas/home";

export type GetHomeSummaryParams = {
  tenantId?: string;
  userId?: string;
  roles?: string[];
};

let cache: { data: HomeSummaryResponse; at: number } | null = null;
const CACHE_TTL_MS = 15_000; // 15s cache

export async function getHomeSummary(_params: GetHomeSummaryParams): Promise<HomeSummaryResponse> {
  const now = Date.now();
  if (cache && now - cache.at < CACHE_TTL_MS) return cache.data;

  // TODO: Replace with real repositories/DB queries and RBAC filtering
  const data: HomeSummaryResponse = {
    tasks: { todo: 5, overdue: 1 },
    meetings: { reviewPending: 2 },
    leads: { new7d: 3 },
    schedule: { today: 4 },
    time: { missing: 1 },
    ai: { available: true },
  };

  cache = { data, at: now };
  return data;
}

export function clearHomeSummaryCache() {
  cache = null;
}
