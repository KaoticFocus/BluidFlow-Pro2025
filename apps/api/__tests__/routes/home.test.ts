import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { home } from "../../src/routes/home";

// Mock auth middleware
vi.mock("../../src/middleware/auth", () => ({
  authMiddleware: vi.fn((c, next) => {
    c.set("auth", {
      user: { id: "user_123", email: "test@example.com", name: "Test User", isPlatformAdmin: false },
      session: { id: "session_123", userId: "user_123", activeTenantId: "tenant_123", expiresAt: new Date() },
      tenantId: "tenant_123",
      permissions: new Set(["taskflow:read", "meetingflow:read", "ai_actions:read"]),
    });
    return next();
  }),
  tenantMiddleware: vi.fn((c, next) => next()),
}));

// Mock homeSummary service
vi.mock("../../src/lib/homeSummary", () => ({
  getHomeSummary: vi.fn().mockResolvedValue({
    tasks: { open: 5, overdue: 2 },
    meetings: { upcoming: 3, pending_review: 1 },
    ai: { pending_review: 4 },
    updatedAt: "2026-01-03T12:00:00.000Z",
  }),
}));

describe("GET /summary", () => {
  const app = new Hono();
  app.route("/home", home);

  it("returns 200 with summary data", async () => {
    const res = await app.request("/home/summary", {
      method: "GET",
      headers: {
        Authorization: "Bearer test_token",
      },
    });

    expect(res.status).toBe(200);
    
    const data = await res.json();
    expect(data).toHaveProperty("tasks");
    expect(data).toHaveProperty("meetings");
    expect(data).toHaveProperty("ai");
    expect(data).toHaveProperty("updatedAt");
  });

  it("returns summary with correct structure", async () => {
    const res = await app.request("/home/summary", {
      method: "GET",
      headers: {
        Authorization: "Bearer test_token",
      },
    });

    const data = await res.json();
    
    expect(data.tasks).toEqual({ open: 5, overdue: 2 });
    expect(data.meetings).toEqual({ upcoming: 3, pending_review: 1 });
    expect(data.ai).toEqual({ pending_review: 4 });
  });

  it("sets cache headers", async () => {
    const res = await app.request("/home/summary", {
      method: "GET",
      headers: {
        Authorization: "Bearer test_token",
      },
    });

    expect(res.headers.get("Cache-Control")).toBe("private, max-age=15");
  });
});