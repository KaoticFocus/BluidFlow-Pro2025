import { Hono } from "hono";
import type { Context } from "hono";
import { HomeSummaryResponseSchema } from "../lib/schemas/home";
import { getHomeSummary } from "../lib/homeSummary";

export const home = new Hono();

home.get("/summary", async (c: Context) => {
  try {
    // TODO: derive tenant/user/roles from auth middleware or headers
    const tenantId = c.req.header("X-Tenant-ID") ?? undefined;
    // @ts-expect-error - user context depends on auth middleware; integrate when available
    const user = (c.get?.("user") as { id?: string; roles?: string[] } | undefined) ?? undefined;

    const data = await getHomeSummary({ tenantId, userId: user?.id, roles: user?.roles });

    // Validate before returning
    const parsed = HomeSummaryResponseSchema.parse(data);
    return c.json(parsed, 200);
  } catch (err: any) {
    return c.json({ error: { message: err?.message ?? "Failed to fetch home summary" } }, 500);
  }
});

export default home;
