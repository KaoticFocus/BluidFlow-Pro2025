import { Hono } from "hono";
import type { Context } from "hono";
import { zValidator } from "@hono/zod-validator";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { 
  CreateAIActionSchema, 
  CreateDecisionSchema, 
  AIActionQuerySchema,
} from "../../../../packages/shared/src/ai-action";
import { PERMISSIONS } from "../../../../packages/shared/src/rbac";
import { authMiddleware, tenantMiddleware, requirePermission } from "../middleware/auth";
import type { AuthContext } from "../middleware/auth";
import { idempotencyMiddleware } from "../middleware/idempotency";
import { createOutboxEvent, FOUNDATION_EVENTS } from "../lib/outbox";
import { prisma } from "../lib/prisma";
import { createPaginatedResponse } from "../lib/pagination";

const ai = new Hono();

// All routes require authentication and tenant context
ai.use("*", authMiddleware, tenantMiddleware);

// Apply idempotency middleware to mutation endpoints
ai.use("*", idempotencyMiddleware);

/**
 * POST /ai/actions
 * Log a new AI action
 */
ai.post(
  "/actions",
  requirePermission(PERMISSIONS.AI_ACTIONS_CREATE),
  zValidator("json", CreateAIActionSchema),
  async (c: Context) => {
    const authCtx = c.get("auth") as AuthContext;
    const tenantId = authCtx.tenantId!;
    const input = c.req.valid("json") as z.infer<typeof CreateAIActionSchema>;

    const action = await prisma.$transaction(async (tx) => {
      const aiAction = await tx.aIActionLog.create({
        data: {
          tenantId,
          actorUserId: authCtx.user.id,
          model: input.model,
          promptHash: input.promptHash,
          inputRefTable: input.inputRefTable || null,
          inputRefId: input.inputRefId || null,
          inputSnapshot: input.inputSnapshot as any,
          outputKind: input.outputKind,
          outputSnapshot: input.outputSnapshot as any,
          citations: input.citations ? (input.citations as any) : null,
          tokenUsage: input.tokenUsage as any,
          estimatedCostUsd: input.estimatedCostUsd ? input.estimatedCostUsd : null,
          requiresReview: input.requiresReview,
          status: input.requiresReview ? "proposed" : "approved",
          plannedSideEffects: input.plannedSideEffects ? (input.plannedSideEffects as any) : null,
          piiDetected: input.piiDetected,
          redactionSummary: input.redactionSummary ? (input.redactionSummary as any) : null,
          traceId: input.traceId || null,
          correlationId: input.correlationId || null,
          latencyMs: input.latencyMs || null,
        },
      });

      // Create planned side effects as pending
      if (input.plannedSideEffects && input.plannedSideEffects.length > 0) {
        await tx.aIActionSideEffect.createMany({
          data: input.plannedSideEffects.map((effect: { type: string; target: string; payload: Record<string, unknown> }) => ({
            logId: aiAction.id,
            tenantId,
            effectType: effect.type,
            targetRef: effect.target,
            payload: effect.payload as any,
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
          traceId: input.traceId || null,
          correlationId: input.correlationId || null,
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
  async (c: Context) => {
    const authCtx = c.get("auth") as AuthContext;
    const tenantId = authCtx.tenantId!;
    const query = c.req.valid("query") as z.infer<typeof AIActionQuerySchema>;

    const where: any = {
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

    const limit = query.limit || 20;
    const actions = await prisma.aIActionLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit + 1, // Fetch one extra to check hasMore
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

    const formattedActions = actions.map((action: any) => ({
      id: action.id,
      model: action.model,
      outputKind: action.outputKind,
      status: action.status,
      requiresReview: action.requiresReview,
      actor: action.actor,
      latestDecision: action.decisions[0] || null,
      createdAt: action.createdAt.toISOString(),
    }));

    const paginated = createPaginatedResponse(formattedActions, limit, (a) => a.id);

    return c.json({
      actions: paginated.items,
      nextCursor: paginated.nextCursor,
      hasMore: paginated.hasMore,
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
  async (c: Context) => {
    const authCtx = c.get("auth") as AuthContext;
    const tenantId = authCtx.tenantId!;
    const actionId = c.req.param("id");

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

    return c.json({
      id: action.id,
      tenantId: action.tenantId,
      actor: action.actor,
      model: action.model,
      promptHash: action.promptHash,
      inputRefTable: action.inputRefTable,
      inputRefId: action.inputRefId,
      inputSnapshot: action.inputSnapshot,
      outputKind: action.outputKind,
      outputSnapshot: action.outputSnapshot,
      citations: action.citations,
      tokenUsage: action.tokenUsage,
      estimatedCostUsd: action.estimatedCostUsd ? Number(action.estimatedCostUsd) : null,
      requiresReview: action.requiresReview,
      status: action.status,
      plannedSideEffects: action.plannedSideEffects,
      piiDetected: action.piiDetected,
      redactionSummary: action.redactionSummary,
      traceId: action.traceId,
      correlationId: action.correlationId,
      latencyMs: action.latencyMs,
      decisions: action.decisions.map((d: any) => ({
        id: d.id,
        decision: d.decision,
        reason: d.reason,
        reviewer: d.reviewer,
        createdAt: d.createdAt.toISOString(),
      })),
      sideEffects: action.sideEffects.map((se: any) => ({
        id: se.id,
        effectType: se.effectType,
        targetRef: se.targetRef,
        payload: se.payload,
        status: se.status,
        error: se.error,
        executedAt: se.executedAt?.toISOString() || null,
        createdAt: se.createdAt.toISOString(),
      })),
      createdAt: action.createdAt.toISOString(),
    });
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
  async (c: Context) => {
    const authCtx = c.get("auth") as AuthContext;
    const tenantId = authCtx.tenantId!;
    const actionId = c.req.param("id");
    const input = c.req.valid("json") as z.infer<typeof CreateDecisionSchema>;

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
          traceId: action.traceId || null,
          correlationId: action.correlationId || null,
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
        // For now, mark side effects as ready for execution
        await tx.aIActionSideEffect.updateMany({
          where: { logId: actionId, status: "pending" },
          data: { status: "executing" },
        });
      }

      return decision;
    });

    return c.json({ decisionId: result.id }, 201);
  }
);

/**
 * GET /ai/actions/pending-review
 * Get actions pending review (convenience endpoint)
 */
ai.get(
  "/actions/pending-review",
  requirePermission(PERMISSIONS.AI_ACTIONS_READ),
  async (c: Context) => {
    const authCtx = c.get("auth") as AuthContext;
    const tenantId = authCtx.tenantId!;

    const limit = 50;
    const actions = await prisma.aIActionLog.findMany({
      where: {
        tenantId,
        requiresReview: true,
        status: "proposed",
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1, // Fetch one extra to check hasMore
      include: {
        actor: { select: { id: true, email: true, name: true } },
      },
    });

    const formattedActions = actions.map((action: any) => ({
      id: action.id,
      model: action.model,
      outputKind: action.outputKind,
      actor: action.actor,
      createdAt: action.createdAt.toISOString(),
    }));

    const paginated = createPaginatedResponse(formattedActions, limit, (a) => a.id);

    return c.json({
      actions: paginated.items,
      nextCursor: paginated.nextCursor,
      hasMore: paginated.hasMore,
    });
  }
);

export { ai };

