/**
 * Internal Event API
 * Service-to-service endpoints for event ingestion and querying
 */

import { Hono } from "hono";
import type { Context } from "hono";
import { zValidator } from "@hono/zod-validator";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { serviceAuthMiddleware, requireScope } from "../../middleware/service-auth";
import { validateEvent } from "@buildflow/events";
import { getRegistry, getAllJsonSchemas } from "@buildflow/events";
import { prisma } from "../../lib/prisma";
import { createOutboxEvent } from "../../lib/outbox";
import { randomUUID } from "node:crypto";

const internalEvents = new Hono();

// All routes require service authentication
internalEvents.use("*", serviceAuthMiddleware);

/**
 * POST /internal/events/ingest
 * Ingest an event from an external service
 */
const IngestEventSchema = z.object({
  schemaId: z.string(),
  version: z.string(),
  tenantId: z.string().uuid(),
  payload: z.record(z.unknown()),
  aggregateId: z.string().uuid().optional(),
  traceId: z.string().uuid().optional(),
  correlationId: z.string().uuid().optional(),
  actorUserId: z.string().uuid().optional(),
  dedupeKey: z.string().optional(),
});

internalEvents.post(
  "/events/ingest",
  requireScope("events:write"),
  zValidator("json", IngestEventSchema),
  async (c: Context) => {
    const input = c.req.valid("json") as z.infer<typeof IngestEventSchema>;
    const serviceAuth = c.get("serviceAuth") as { serviceName: string };

    // Validate schema exists
    const registry = getRegistry();
    const schemaMetadata = registry.get(input.schemaId, input.version);

    if (!schemaMetadata) {
      throw new HTTPException(400, {
        message: `Schema not found: ${input.schemaId}@${input.version}`,
      });
    }

    // Validate payload against schema
    const validation = validateEvent(input.schemaId, input.version, {
      eventId: randomUUID(),
      eventType: `${input.schemaId.split(".").slice(1).join(".")}.${input.version}`,
      version: 1,
      occurredAt: new Date(),
      tenantId: input.tenantId,
      actorUserId: input.actorUserId || null,
      traceId: input.traceId || null,
      correlationId: input.correlationId || null,
      payload: input.payload,
    });

    if (!validation.valid) {
      throw new HTTPException(400, {
        message: "Payload validation failed",
        cause: validation.errors,
      });
    }

    // Warn about deprecation
    if (validation.warnings && validation.warnings.length > 0) {
      console.warn(`[Event Ingest] Deprecation warning: ${validation.warnings.join(", ")}`);
    }

    // Write to outbox
    const eventId = randomUUID();
    const eventType = `${input.schemaId.split(".").slice(1).join(".")}.${input.version}`;

    const outboxEvent = await prisma.outboxEvent.create({
      data: createOutboxEvent({
        tenantId: input.tenantId,
        eventType,
        aggregateId: input.aggregateId || null,
        actorUserId: input.actorUserId || null,
        traceId: input.traceId || null,
        correlationId: input.correlationId || null,
        payload: {
          ...input.payload,
          eventId,
          eventType,
          version: 1,
          occurredAt: new Date().toISOString(),
          tenantId: input.tenantId,
          actorUserId: input.actorUserId || null,
        },
        dedupeKey: input.dedupeKey || null,
      }),
    });

    return c.json(
      {
        eventId: outboxEvent.id,
        status: "accepted",
        warnings: validation.warnings || undefined,
      },
      202
    );
  }
);

/**
 * GET /internal/event-log
 * Query event log
 */
const EventLogQuerySchema = z.object({
  after_sequence: z.coerce.bigint().optional(),
  tenant_id: z.string().uuid().optional(),
  schema_id: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(1000).default(100),
});

internalEvents.get(
  "/event-log",
  requireScope("events:read"),
  zValidator("query", EventLogQuerySchema),
  async (c: Context) => {
    const query = c.req.valid("query") as z.infer<typeof EventLogQuerySchema>;

    const where: any = {};

    if (query.tenant_id) {
      where.tenantId = query.tenant_id;
    }

    if (query.schema_id) {
      where.schemaId = query.schema_id;
    }

    if (query.after_sequence) {
      where.sequence = { gt: query.after_sequence };
    }

    const events = await prisma.eventLog.findMany({
      where,
      orderBy: { sequence: "asc" },
      take: query.limit,
    });

    return c.json({
      events: events.map((event) => ({
        sequence: event.sequence.toString(),
        eventId: event.eventId,
        tenantId: event.tenantId,
        schemaId: event.schemaId,
        schemaVersion: event.schemaVersion,
        headers: event.headers,
        payloadRedacted: event.payloadRedacted,
        payloadHash: event.payloadHash,
        publishedAt: event.publishedAt.toISOString(),
      })),
      nextSequence: events.length === query.limit && events.length > 0 
        ? events[events.length - 1].sequence.toString() 
        : null,
    });
  }
);

/**
 * GET /internal/event-schemas
 * List all registered event schemas
 */
internalEvents.get("/event-schemas", requireScope("events:read"), async (c: Context) => {
  const schemas = getAllJsonSchemas();

  return c.json({
    schemas: schemas.map((schema) => ({
      schemaId: schema.schemaId,
      version: schema.version,
      deprecated: schema.deprecated || false,
      deprecatedSince: schema.deprecatedSince || null,
      description: schema.description || null,
      jsonSchema: schema.jsonSchema,
    })),
    count: schemas.length,
  });
});

/**
 * GET /internal/event-schemas/:schemaId/:version
 * Get specific schema
 */
internalEvents.get("/event-schemas/:schemaId/:version", requireScope("events:read"), async (c: Context) => {
  const schemaId = c.req.param("schemaId");
  const version = c.req.param("version");

  const registry = getRegistry();
  const metadata = registry.get(schemaId, version);

  if (!metadata) {
    throw new HTTPException(404, {
      message: `Schema not found: ${schemaId}@${version}`,
    });
  }

  const jsonSchema = metadata.schema ? 
    // Simplified - in production use zod-to-json-schema
    { type: "object", properties: {} } : 
    null;

  return c.json({
    schemaId: metadata.schemaId,
    version: metadata.version,
    deprecated: metadata.deprecated || false,
    deprecatedSince: metadata.deprecatedSince || null,
    description: metadata.description || null,
    jsonSchema,
  });
});

export { internalEvents };

