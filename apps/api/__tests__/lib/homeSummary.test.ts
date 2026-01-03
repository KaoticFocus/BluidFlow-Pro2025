import { describe, it, expect, vi, beforeEach } from "vitest";
import { getHomeSummary, invalidateHomeSummaryCache } from "../../src/lib/homeSummary";

// Mock prisma
vi.mock("../../src/lib/prisma", () => ({
  prisma: {
    task: {
      count: vi.fn().mockResolvedValue(5),
    },
    meeting: {
      count: vi.fn().mockResolvedValue(2),
    },
    aIAction: {
      count: vi.fn().mockResolvedValue(3),
    },
  },
}));

describe("getHomeSummary", () => {
  const tenantId = "tenant_123";
  const userId = "user_456";
  const fullPermissions = new Set([
    "taskflow:read",
    "meetingflow:read",
    "ai_actions:read",
    "leads:read",
    "scheduleflow:read",
    "timeclock:read",
    "documents:read",
  ]);

  beforeEach(() => {
    invalidateHomeSummaryCache(tenantId);
  });

  it("returns summary with all modules when user has full permissions", async () => {
    const summary = await getHomeSummary(tenantId, userId, fullPermissions);
    
    expect(summary).toHaveProperty("updatedAt");
    expect(summary.tasks).toBeDefined();
    expect(summary.meetings).toBeDefined();
    expect(summary.ai).toBeDefined();
    expect(summary.leads).toBeDefined();
    expect(summary.schedule).toBeDefined();
    expect(summary.timeclock).toBeDefined();
    expect(summary.documents).toBeDefined();
  });

  it("excludes modules user does not have permission for", async () => {
    const limitedPermissions = new Set(["taskflow:read"]);
    const summary = await getHomeSummary(tenantId, userId, limitedPermissions);
    
    expect(summary.tasks).toBeDefined();
    expect(summary.meetings).toBeUndefined();
    expect(summary.ai).toBeUndefined();
  });

  it("returns empty summary when user has no permissions", async () => {
    const noPermissions = new Set<string>();
    const summary = await getHomeSummary(tenantId, userId, noPermissions);
    
    expect(summary.tasks).toBeUndefined();
    expect(summary.meetings).toBeUndefined();
    expect(summary.ai).toBeUndefined();
  });

  it("caches results and returns cached data on subsequent calls", async () => {
    const summary1 = await getHomeSummary(tenantId, userId, fullPermissions);
    const summary2 = await getHomeSummary(tenantId, userId, fullPermissions);
    
    // Same reference means cached
    expect(summary1.updatedAt).toBe(summary2.updatedAt);
  });

  it("invalidates cache correctly", async () => {
    const summary1 = await getHomeSummary(tenantId, userId, fullPermissions);
    invalidateHomeSummaryCache(tenantId);
    const summary2 = await getHomeSummary(tenantId, userId, fullPermissions);
    
    // Different timestamps mean cache was invalidated
    expect(summary1.updatedAt).not.toBe(summary2.updatedAt);
  });
});