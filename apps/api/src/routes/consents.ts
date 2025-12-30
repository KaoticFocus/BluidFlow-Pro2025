import { Hono } from "hono";
import type { Context } from "hono";
import { zValidator } from "@hono/zod-validator";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { 
  CreateConsentSchema, 
  QueryConsentSchema, 
  CheckConsentSchema,
} from "../../../../packages/shared/src/consent";
import { PERMISSIONS } from "../../../../packages/shared/src/rbac";
import { authMiddleware, tenantMiddleware, requirePermission } from "../middleware/auth";
import type { AuthContext } from "../middleware/auth";
import { idempotencyMiddleware } from "../middleware/idempotency";
import { createOutboxEvent, FOUNDATION_EVENTS } from "../lib/outbox";
import { prisma } from "../lib/prisma";
import { parsePagination, createPaginatedResponse } from "../lib/pagination";

const consents = new Hono();

// All routes require authentication and tenant context
consents.use("*", authMiddleware, tenantMiddleware);

// Apply idempotency middleware to mutation endpoints
consents.use("*", idempotencyMiddleware);

/**
 * POST /consents
 * Capture a new consent
 */
consents.post(
  "/",
  requirePermission(PERMISSIONS.CONSENTS_WRITE),
  zValidator("json", CreateConsentSchema),
  async (c: Context) => {
    const authCtx = c.get("auth") as AuthContext;
    const tenantId = authCtx.tenantId!;
    const input = c.req.valid("json") as z.infer<typeof CreateConsentSchema>;

    const consent = await prisma.$transaction(async (tx) => {
      const newConsent = await tx.consent.create({
        data: {
          tenantId,
          subjectType: input.subjectType,
          subjectId: input.subjectId,
          purposeKey: input.purposeKey,
          channel: input.channel || null,
          policyHash: input.policyHash,
          textVersion: input.textVersion,
          language: input.language,
          actorUserId: authCtx.user.id,
          evidence: input.evidence ? (input.evidence as any) : null,
        },
      });

      await tx.outboxEvent.create({
        data: createOutboxEvent({
          tenantId,
          eventType: FOUNDATION_EVENTS.CONSENT_CAPTURED,
          aggregateId: newConsent.id,
          actorUserId: authCtx.user.id,
          payload: {
            consentId: newConsent.id,
            subjectType: input.subjectType,
            subjectId: input.subjectId,
            purposeKey: input.purposeKey,
            channel: input.channel || null,
            policyHash: input.policyHash,
          },
        }),
      });

      return newConsent;
    });

    return c.json({ consentId: consent.id }, 201);
  }
);

/**
 * GET /consents
 * Query consents with filters
 */
consents.get(
  "/",
  requirePermission(PERMISSIONS.CONSENTS_READ),
  zValidator("query", QueryConsentSchema),
  async (c: Context) => {
    const authCtx = c.get("auth") as AuthContext;
    const tenantId = authCtx.tenantId!;
    const query = c.req.valid("query") as z.infer<typeof QueryConsentSchema>;
    const pagination = parsePagination(c, 20, 100);

    const where: any = {
      tenantId,
    };

    if (query.subjectType) where.subjectType = query.subjectType;
    if (query.subjectId) where.subjectId = query.subjectId;
    if (query.purposeKey) where.purposeKey = query.purposeKey;
    if (query.activeOnly !== false) {
      where.revokedAt = null;
    }
    if (pagination.cursor) {
      where.id = { lt: pagination.cursor };
    }

    const consentsList = await prisma.consent.findMany({
      where,
      orderBy: { capturedAt: "desc" },
      take: pagination.limit + 1, // Fetch one extra to check hasMore
      include: {
        actor: { select: { id: true, email: true, name: true } },
      },
    });

    const formattedConsents = consentsList.map((consent: any) => ({
      id: consent.id,
      subjectType: consent.subjectType,
      subjectId: consent.subjectId,
      purposeKey: consent.purposeKey,
      channel: consent.channel,
      policyHash: consent.policyHash,
      textVersion: consent.textVersion,
      language: consent.language,
      actor: consent.actor,
      evidence: consent.evidence,
      capturedAt: consent.capturedAt.toISOString(),
      revokedAt: consent.revokedAt?.toISOString() || null,
    }));

    const paginated = createPaginatedResponse(formattedConsents, pagination.limit, (consent) => consent.id);

    return c.json({
      consents: paginated.items,
      nextCursor: paginated.nextCursor,
      hasMore: paginated.hasMore,
    });
  }
);

/**
 * POST /consents/check
 * Check if active consent exists for a subject/purpose
 */
consents.post(
  "/check",
  requirePermission(PERMISSIONS.CONSENTS_READ),
  zValidator("json", CheckConsentSchema),
  async (c: Context) => {
    const authCtx = c.get("auth") as AuthContext;
    const tenantId = authCtx.tenantId!;
    const input = c.req.valid("json") as z.infer<typeof CheckConsentSchema>;

    const consent = await prisma.consent.findFirst({
      where: {
        tenantId,
        subjectType: input.subjectType,
        subjectId: input.subjectId,
        purposeKey: input.purposeKey,
        revokedAt: null,
      },
      orderBy: { capturedAt: "desc" },
      include: {
        actor: { select: { id: true, email: true, name: true } },
      },
    });

    return c.json({
      hasConsent: !!consent,
      consent: consent ? {
        id: consent.id,
        subjectType: consent.subjectType,
        subjectId: consent.subjectId,
        purposeKey: consent.purposeKey,
        channel: consent.channel,
        policyHash: consent.policyHash,
        textVersion: consent.textVersion,
        language: consent.language,
        actor: consent.actor,
        evidence: consent.evidence,
        capturedAt: consent.capturedAt.toISOString(),
      } : null,
      expiresAt: null, // Consents don't expire in this implementation
    });
  }
);

/**
 * POST /consents/:id/revoke
 * Revoke a consent
 */
consents.post(
  "/:id/revoke",
  requirePermission(PERMISSIONS.CONSENTS_WRITE),
  zValidator("json", z.object({
    reason: z.string().max(500).optional(),
  }).optional()),
  async (c: Context) => {
    const authCtx = c.get("auth") as AuthContext;
    const tenantId = authCtx.tenantId!;
    const consentId = c.req.param("id");
    const input = c.req.valid("json") as { reason?: string } | undefined;

    const consent = await prisma.consent.findFirst({
      where: { id: consentId, tenantId },
    });

    if (!consent) {
      throw new HTTPException(404, { message: "Consent not found" });
    }

    if (consent.revokedAt) {
      throw new HTTPException(400, { message: "Consent has already been revoked" });
    }

    await prisma.$transaction(async (tx) => {
      await tx.consent.update({
        where: { id: consentId },
        data: {
          revokedAt: new Date(),
          revokedBy: authCtx.user.id,
        },
      });

      await tx.outboxEvent.create({
        data: createOutboxEvent({
          tenantId,
          eventType: FOUNDATION_EVENTS.CONSENT_REVOKED,
          aggregateId: consentId,
          actorUserId: authCtx.user.id,
          payload: {
            consentId,
            subjectType: consent.subjectType,
            subjectId: consent.subjectId,
            purposeKey: consent.purposeKey,
            revokedById: authCtx.user.id,
            reason: input?.reason || null,
          },
        }),
      });
    });

    return c.body(null, 204);
  }
);

/**
 * GET /consents/subject/:subjectType/:subjectId
 * Get all consents for a specific subject
 */
consents.get(
  "/subject/:subjectType/:subjectId",
  requirePermission(PERMISSIONS.CONSENTS_READ),
  async (c: Context) => {
    const authCtx = c.get("auth") as AuthContext;
    const tenantId = authCtx.tenantId!;
    const subjectType = c.req.param("subjectType");
    const subjectId = c.req.param("subjectId");

    const consentsList = await prisma.consent.findMany({
      where: {
        tenantId,
        subjectType,
        subjectId,
      },
      orderBy: { capturedAt: "desc" },
      include: {
        actor: { select: { id: true, email: true, name: true } },
      },
    });

    // Group by purpose and get effective state
    const byPurpose: Record<string, {
      purposeKey: string;
      hasActiveConsent: boolean;
      latestConsent: any;
      history: any[];
    }> = {};

    for (const consent of consentsList) {
      if (!byPurpose[consent.purposeKey]) {
        byPurpose[consent.purposeKey] = {
          purposeKey: consent.purposeKey,
          hasActiveConsent: consent.revokedAt === null,
          latestConsent: {
            id: consent.id,
            subjectType: consent.subjectType,
            subjectId: consent.subjectId,
            purposeKey: consent.purposeKey,
            channel: consent.channel,
            policyHash: consent.policyHash,
            textVersion: consent.textVersion,
            language: consent.language,
            actor: consent.actor,
            evidence: consent.evidence,
            capturedAt: consent.capturedAt.toISOString(),
            revokedAt: consent.revokedAt?.toISOString() || null,
          },
          history: [],
        };
      }
      byPurpose[consent.purposeKey].history.push({
        id: consent.id,
        subjectType: consent.subjectType,
        subjectId: consent.subjectId,
        purposeKey: consent.purposeKey,
        channel: consent.channel,
        policyHash: consent.policyHash,
        textVersion: consent.textVersion,
        language: consent.language,
        actor: consent.actor,
        evidence: consent.evidence,
        capturedAt: consent.capturedAt.toISOString(),
        revokedAt: consent.revokedAt?.toISOString() || null,
      });
    }

    return c.json({ 
      subject: { type: subjectType, id: subjectId }, 
      consents: Object.values(byPurpose) 
    });
  }
);

export { consents };

