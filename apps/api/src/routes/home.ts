import { Hono } from "hono";
import type { Context } from "hono";
import { authMiddleware, tenantMiddleware, type AuthContext } from "../middleware/auth";
import { getHomeSummary } from "../lib/homeSummary";
import { HomeSummarySchema } from "../lib/schemas/home";

/**
 * Home API Routes
 * 
 * GET /summary - Returns role-aware module summary for the home page
 * 
 * Mounted at /v1/home and /home for backwards compatibility
 */
export const home = new Hono();

// All routes require authentication and tenant context
home.use("*", authMiddleware, tenantMiddleware);

/**
 * GET /summary
 * 
 * Returns a role-aware summary of all modules the user can access.
 * Response is cached for 10-30 seconds per tenant/user.
 * 
 * Response shape: {
 *   tasks?: { open: number, overdue: number },
 *   meetings?: { upcoming: number, pending_review: number },
 *   leads?: { new: number },
 *   schedule?: { upcoming_plans: number },
 *   timeclock?: { active_sessions: number },
 *   documents?: { pending: number },
 *   ai?: { pending_review: number },
 *   updatedAt: string
 * }
 * 
 * @openapi
 * /v1/home/summary:
 *   get:
 *     summary: Get home page summary
 *     description: Returns role-aware module summary with badge counts
 *     tags: [Home]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Home summary
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/HomeSummary"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - No tenant access
 */
home.get("/summary", async (c: Context) => {
  const auth = c.get("auth") as AuthContext;
  const tenantId = auth.tenantId!;
  const userId = auth.user.id;
  const permissions = auth.permissions;

  // TODO: Add OpenTelemetry span
  // const span = tracer.startSpan("home.getSummary");
  
  try {
    const summary = await getHomeSummary(tenantId, userId, permissions);
    
    // Validate response shape
    const validated = HomeSummarySchema.parse(summary);
    
    // Set cache headers (10-30s cache)
    c.header("Cache-Control", "private, max-age=15");
    
    return c.json(validated);
  } catch (error) {
    console.error("[Home] Error getting summary:", error);
    
    // Return empty summary on error
    return c.json({
      updatedAt: new Date().toISOString(),
    });
  }
});