import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { HTTPException } from "hono/http-exception";
import { 
  CreateConsentSchema, 
  QueryConsentSchema, 
  CheckConsentSchema,
  PERMISSIONS 
} from "@buildflow/shared";
import { authMiddleware, tenantMiddleware, requirePermission } from "../middleware/auth";
import { createOutboxEvent, FOUNDATION_EVENTS } from "../lib/outbox";

const consents = new Hono();

// All routes require authentication and tenant context
consents.use("*", authMiddleware, tenantMiddleware);

/**
 * POST /consents
 * Capture a new consent
 */
consents.post(
  "/",
  requirePermission(PERMISSIONS.CONSENTS_WRITE),
  zValidator("json", CreateConsentSchema),
  async (c) => {
    const authCtx = c.get("auth");
    const tenantId = authCtx.tenantId!;
    const input = c.req.valid("json");

    // TODO: Replace with Prisma implementation
    /*
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
          evidence: input.evidence || null,
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
    */

    return c.json({ consentId: "placeholder-consent-id" }, 201);
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
  async (c) => {
    const authCtx = c.get("auth");
    const tenantId = authCtx.tenantId!;
    const query = c.req.valid("query");

    // TODO: Replace with Prisma implementation
    /*
    const where: Prisma.ConsentWhereInput = {
      tenantId,
    };

    if (query.subjectType) where.subjectType = query.subjectType;
    if (query.subjectId) where.subjectId = query.subjectId;
    if (query.purposeKey) where.purposeKey = query.purposeKey;
    if (query.activeOnly) where.revokedAt = null;

    const consents = await prisma.consent.findMany({
      where,
      orderBy: { capturedAt: "desc" },
      include: {
        actor: { select: { id: true, email: true, name: true } },
      },
    });
    */

    return c.json({ consents: [] });
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
  async (c) => {
    const authCtx = c.get("auth");
    const tenantId = authCtx.tenantId!;
    const input = c.req.valid("json");

    // TODO: Replace with Prisma implementation
    /*
    const consent = await prisma.consent.findFirst({
      where: {
        tenantId,
        subjectType: input.subjectType,
        subjectId: input.subjectId,
        purposeKey: input.purposeKey,
        revokedAt: null,
      },
      orderBy: { capturedAt: "desc" },
    });

    return c.json({
      hasConsent: !!consent,
      consent: consent || null,
      expiresAt: null, // Consents don't expire in this implementation
    });
    */

    return c.json({
      hasConsent: false,
      consent: null,
      expiresAt: null,
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
  async (c) => {
    const authCtx = c.get("auth");
    const tenantId = authCtx.tenantId!;
    const consentId = c.req.param("id");

    // TODO: Replace with Prisma implementation
    /*
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
            reason: null,
          },
        }),
      });
    });
    */

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
  async (c) => {
    const authCtx = c.get("auth");
    const tenantId = authCtx.tenantId!;
    const subjectType = c.req.param("subjectType");
    const subjectId = c.req.param("subjectId");

    // TODO: Replace with Prisma implementation
    /*
    const consents = await prisma.consent.findMany({
      where: {
        tenantId,
        subjectType,
        subjectId,
      },
      orderBy: { capturedAt: "desc" },
    });

    // Group by purpose and get effective state
    const byPurpose = consents.reduce((acc, consent) => {
      if (!acc[consent.purposeKey]) {
        acc[consent.purposeKey] = {
          purposeKey: consent.purposeKey,
          hasActiveConsent: consent.revokedAt === null,
          latestConsent: consent,
          history: [],
        };
      }
      acc[consent.purposeKey].history.push(consent);
      return acc;
    }, {} as Record<string, { purposeKey: string; hasActiveConsent: boolean; latestConsent: typeof consents[0]; history: typeof consents }>);

    return c.json({ subject: { type: subjectType, id: subjectId }, consents: Object.values(byPurpose) });
    */

    return c.json({ 
      subject: { type: subjectType, id: subjectId }, 
      consents: [] 
    });
  }
);

export { consents };

