import { Hono } from "hono";
import { z } from "zod";
import { randomUUID } from "node:crypto";

// Minimal TaskFlow-Pro API scaffold.
// NOTE: This is intentionally "storage-less" for now; next step is to wire Prisma + auth/tenant/RBAC.

export const taskflowRouter = new Hono();

const UploadPresignBodySchema = z.object({
  type: z.enum(["audio", "image"]),
  mime_type: z.string().min(1),
  size_bytes: z.number().int().positive()
});

taskflowRouter.post("/uploads/presign", async (c: any) => {
  const body = UploadPresignBodySchema.safeParse(await c.req.json().catch(() => null));
  if (!body.success) return c.json({ error: "invalid_body", details: body.error.flatten() }, 400);

  // TODO: issue a real presigned URL (R2/S3). For now return stub fields.
  return c.json({
    upload_url: "https://example.invalid/presign",
    attachment_id: randomUUID(),
    expires_at: new Date(Date.now() + 5 * 60_000).toISOString()
  });
});

const CreateTaskBodySchema = z.object({
  org_id: z.string().min(1),
  project_id: z.string().min(1).optional(),
  source: z.enum(["text", "voice", "photo"]),
  title: z.string().max(140).optional(),
  description: z.string().max(5000).optional(),
  attachment_id: z.string().min(1).optional(),
  type: z.enum(["general", "punch"]).optional(),
  consent: z.boolean().optional()
});

taskflowRouter.post("/tasks", async (c: any) => {
  const body = CreateTaskBodySchema.safeParse(await c.req.json().catch(() => null));
  if (!body.success) return c.json({ error: "invalid_body", details: body.error.flatten() }, 400);

  const now = new Date().toISOString();
  const taskId = randomUUID();

  const isAiSource = body.data.source === "voice" || body.data.source === "photo";
  const status = isAiSource ? "pending_approval" : "open";

  return c.json(
    {
      task: {
        id: taskId,
        org_id: body.data.org_id,
        project_id: body.data.project_id ?? null,
        source: body.data.source,
        title: body.data.title ?? "(untitled)",
        description_redacted: body.data.description ?? "",
        type: body.data.type ?? "general",
        status,
        created_at: now,
        updated_at: now
      },
      ai_job_id: isAiSource ? randomUUID() : null
    },
    201
  );
});

taskflowRouter.get("/tasks", (c: any) => {
  // TODO: list from DB with filters.
  return c.json({ tasks: [] });
});

taskflowRouter.get("/tasks/:id", (c: any) => {
  // TODO: fetch from DB
  return c.json({ error: "not_implemented" }, 501);
});

taskflowRouter.post("/tasks/:id/approve", async (c: any) => {
  // TODO: RBAC gated approval → publish task.
  const body = z.object({ note: z.string().max(2000).optional() }).safeParse(await c.req.json().catch(() => null));
  if (!body.success) return c.json({ error: "invalid_body", details: body.error.flatten() }, 400);

  return c.json({ status: "approved" });
});

const GenerateDailyPlanSchema = z.object({
  org_id: z.string().min(1),
  project_id: z.string().min(1).optional(),
  date: z.string().min(1),
  constraints: z.record(z.any()).optional()
});

taskflowRouter.post("/daily-plans/generate", async (c: any) => {
  const body = GenerateDailyPlanSchema.safeParse(await c.req.json().catch(() => null));
  if (!body.success) return c.json({ error: "invalid_body", details: body.error.flatten() }, 400);

  return c.json(
    {
      daily_plan_id: randomUUID(),
      ai_job_id: randomUUID()
    },
    202
  );
});

taskflowRouter.get("/daily-plans/:id", (c: any) => {
  return c.json({ error: "not_implemented" }, 501);
});


