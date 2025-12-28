import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { HTTPException } from "hono/http-exception";
import { 
  CreateAIActionSchema, 
  CreateDecisionSchema, 
  AIActionQuerySchema,
  PERMISSIONS 
} from "@buildflow/shared";
import { authMiddleware, tenantMiddleware, requirePermission } from "../middleware/auth";
import { createOutboxEvent, FOUNDATION_EVENTS } from "../lib/outbox";

const ai = new Hono();

// All routes require authentication and tenant context
ai.use("*", authMiddleware, tenantMiddleware);

/**
 * POST /ai/actions
 * Log a new AI action
 */
ai.post(
  "/actions",
  requirePermission(PERMISSIONS.AI_ACTIONS_CREATE),
  zValidator("json", CreateAIActionSchema),
  async (c) => {
    const authCtx = c.get("auth");
    const tenantId = authCtx.tenantId!;
    const input = c.req.valid("json");

    // TODO: Replace with Prisma implementation
    /*
    const action = await prisma.$transaction(async (tx) => {
      const aiAction = await tx.aIActionLog.create({
        data: {
          tenantId,
          actorUserId: authCtx.user.id,
          model: input.model,
          promptHash: input.promptHash,
          inputRefTable: input.inputRefTable || null,
          inputRefId: input.inputRefId || null,
          inputSnapshot: input.inputSnapshot,
          outputKind: input.outputKind,
          outputSnapshot: input.outputSnapshot,
          citations: input.citations || null,
          tokenUsage: input.tokenUsage,
          estimatedCostUsd: input.estimatedCostUsd || null,
          requiresReview: input.requiresReview,
          status: input.requiresReview ? "proposed" : "approved",
          plannedSideEffects: input.plannedSideEffects || null,
          piiDetected: input.piiDetected,
          redactionSummary: input.redactionSummary || null,
          traceId: input.traceId || null,
          correlationId: input.correlationId || null,
          latencyMs: input.latencyMs || null,
        },
      });

      // Create planned side effects as pending
      if (input.plannedSideEffects?.length) {
        await tx.aIActionSideEffect.createMany({
          data: input.plannedSideEffects.map((effect) => ({
            logId: aiAction.id,
            tenantId,
            effectType: effect.type,
            targetRef: effect.target,
            payload: effect.payload,
            status: "pending",
          })),
        });
      }

      // Emit event
      await tx.outboxEvent.create({
        data: createOutboxEvent({
          tenantId,
          eventType: FOUNDATION_EVENTS.AI_ACTION_LOGGED,
          aggregateId: aiAction.id,
          actorUserId: authCtx.user.id,
          traceId: input.traceId,
          correlationId: input.correlationId,
          payload: {
            actionId: aiAction.id,
            model: input.model,
            outputKind: input.outputKind,
            requiresReview: input.requiresReview,
            inputRefTable: input.inputRefTable || null,
            inputRefId: input.inputRefId || null,
            tokenUsage: input.tokenUsage,
            estimatedCostUsd: input.estimatedCostUsd || null,
          },
        }),
      });

      return aiAction;
    });

    return c.json({ actionId: action.id }, 201);
    */

    return c.json({ actionId: "placeholder-action-id" }, 201);
  }
);

/**
 * GET /ai/actions
 * List AI actions with filters
 */
ai.get(
  "/actions",
  requirePermission(PERMISSIONS.AI_ACTIONS_READ),
  zValidator("query", AIActionQuerySchema),
  async (c) => {
    const authCtx = c.get("auth");
    const tenantId = authCtx.tenantId!;
    const query = c.req.valid("query");

    // TODO: Replace with Prisma implementation
    /*
    const where: Prisma.AIActionLogWhereInput = {
      tenantId,
    };

    if (query.status) where.status = query.status;
    if (query.requiresReview !== undefined) where.requiresReview = query.requiresReview;
    if (query.actorUserId) where.actorUserId = query.actorUserId;
    if (query.model) where.model = query.model;
    if (query.inputRefTable) where.inputRefTable = query.inputRefTable;
    if (query.createdFrom || query.createdTo) {
      where.createdAt = {};
      if (query.createdFrom) where.createdAt.gte = query.createdFrom;
      if (query.createdTo) where.createdAt.lte = query.createdTo;
    }
    if (query.cursor) {
      where.id = { lt: query.cursor };
    }

    const actions = await prisma.aIActionLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: query.limit,
      include: {
        actor: { select: { id: true, email: true, name: true } },
        decisions: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            reviewer: { select: { id: true, email: true, name: true } },
          },
        },
      },
    });

    const nextCursor = actions.length === query.limit ? actions[actions.length - 1].id : null;
    */

    return c.json({ 
      actions: [],
      nextCursor: null,
    });
  }
);

/**
 * GET /ai/actions/:id
 * Get a specific AI action with full details
 */
ai.get(
  "/actions/:id",
  requirePermission(PERMISSIONS.AI_ACTIONS_READ),
  async (c) => {
    const authCtx = c.get("auth");
    const tenantId = authCtx.tenantId!;
    const actionId = c.req.param("id");

    // TODO: Replace with Prisma implementation
    /*
    const action = await prisma.aIActionLog.findFirst({
      where: { id: actionId, tenantId },
      include: {
        actor: { select: { id: true, email: true, name: true } },
        decisions: {
          orderBy: { createdAt: "desc" },
          include: {
            reviewer: { select: { id: true, email: true, name: true } },
          },
        },
        sideEffects: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!action) {
      throw new HTTPException(404, { message: "AI action not found" });
    }
    */

    throw new HTTPException(404, { message: "AI action not found" });
  }
);

/**
 * POST /ai/actions/:id/decision
 * Approve or reject an AI action
 */
ai.post(
  "/actions/:id/decision",
  requirePermission(PERMISSIONS.AI_ACTIONS_APPROVE),
  zValidator("json", CreateDecisionSchema),
  async (c) => {
    const authCtx = c.get("auth");
    const tenantId = authCtx.tenantId!;
    const actionId = c.req.param("id");
    const input = c.req.valid("json");

    // TODO: Replace with Prisma implementation
    /*
    const action = await prisma.aIActionLog.findFirst({
      where: { id: actionId, tenantId },
      include: { sideEffects: true },
    });

    if (!action) {
      throw new HTTPException(404, { message: "AI action not found" });
    }

    if (action.status !== "proposed") {
      throw new HTTPException(400, { message: `Cannot make decision on action with status: ${action.status}` });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create decision record
      const decision = await tx.aIActionDecision.create({
        data: {
          logId: actionId,
          reviewerUserId: authCtx.user.id,
          decision: input.decision,
          reason: input.reason || null,
        },
      });

      // Update action status
      const newStatus = input.decision === "approve" ? "approved" : "rejected";
      await tx.aIActionLog.update({
        where: { id: actionId },
        data: { status: newStatus },
      });

      // Emit appropriate event
      const eventType = input.decision === "approve" 
        ? FOUNDATION_EVENTS.AI_ACTION_APPROVED 
        : FOUNDATION_EVENTS.AI_ACTION_REJECTED;

      await tx.outboxEvent.create({
        data: createOutboxEvent({
          tenantId,
          eventType,
          aggregateId: actionId,
          actorUserId: authCtx.user.id,
          traceId: action.traceId,
          correlationId: action.correlationId,
          payload: {
            actionId,
            decisionId: decision.id,
            reviewerUserId: authCtx.user.id,
            reason: input.reason || null,
            plannedSideEffectsCount: action.sideEffects.length,
          },
        }),
      });

      // If approved, queue side effects for execution
      if (input.decision === "approve" && action.sideEffects.length > 0) {
        // TODO: Queue BullMQ jobs for each side effect
      }

      return decision;
    });

    return c.json({ decisionId: result.id }, 201);
    */

    return c.json({ decisionId: "placeholder-decision-id" }, 201);
  }
);

/**
 * GET /ai/actions/pending-review
 * Get actions pending review (convenience endpoint)
 */
ai.get(
  "/actions/pending-review",
  requirePermission(PERMISSIONS.AI_ACTIONS_READ),
  async (c) => {
    const authCtx = c.get("auth");
    const tenantId = authCtx.tenantId!;

    // TODO: Replace with Prisma implementation
    /*
    const actions = await prisma.aIActionLog.findMany({
      where: {
        tenantId,
        requiresReview: true,
        status: "proposed",
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        actor: { select: { id: true, email: true, name: true } },
      },
    });
    */

    return c.json({ actions: [] });
  }
);

export { ai };

