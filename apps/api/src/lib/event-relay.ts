/**
 * Event Relay Logic
 * Moves events from outbox to event_log with idempotent publishing
 */

import { prisma } from "./prisma";
import { createHash } from "node:crypto";
import { randomUUID } from "node:crypto";

const BATCH_SIZE = 15;
const MAX_ATTEMPTS = 10;

/**
 * Extract schema ID and version from event type
 * e.g., "user.created.v1" -> { schemaId: "foundation.user.created", version: "v1" }
 */
function parseEventType(eventType: string): { schemaId: string; version: string } {
  const parts = eventType.split(".");
  if (parts.length < 2) {
    throw new Error(`Invalid event type format: ${eventType}`);
  }

  const version = parts[parts.length - 1]; // Last part is version
  const schemaId = parts.slice(0, -1).join("."); // Everything except last part

  return { schemaId, version };
}

/**
 * Redact sensitive fields from payload for privacy
 */
function redactPayload(payload: any): any {
  const sensitiveFields = ["password", "passwordHash", "token", "secret", "apiKey", "ssn", "creditCard"];
  
  function redactObject(obj: any): any {
    if (typeof obj !== "object" || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(redactObject);
    }

    const redacted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveFields.some((field) => lowerKey.includes(field))) {
        redacted[key] = "[REDACTED]";
      } else if (typeof value === "object" && value !== null) {
        redacted[key] = redactObject(value);
      } else {
        redacted[key] = value;
      }
    }

    return redacted;
  }

  return redactObject(payload);
}

/**
 * Process a batch of outbox events and move them to event_log
 */
export async function relayOutboxEvents(): Promise<{
  processed: number;
  failed: number;
  skipped: number;
}> {
  let processed = 0;
  let failed = 0;
  let skipped = 0;

  // Find pending events
  const events = await prisma.outboxEvent.findMany({
    where: {
      status: "pending",
      attempts: { lt: MAX_ATTEMPTS },
    },
    take: BATCH_SIZE,
    orderBy: { createdAt: "asc" },
  });

  for (const event of events) {
    try {
      // Parse event type to get schema info
      const { schemaId, version } = parseEventType(event.eventType);

      // Generate event ID from dedupeKey or create new UUID
      // If dedupeKey exists, use it as eventId for idempotency
      // Otherwise, generate a deterministic UUID from tenantId + eventType + aggregateId + payload hash
      let eventId: string;
      if (event.dedupeKey) {
        // Use dedupeKey as eventId (it's already unique per tenant)
        eventId = event.dedupeKey;
      } else {
        // Generate deterministic UUID from event content
        const payloadHash = createHash("sha256")
          .update(JSON.stringify(event.payload))
          .digest("hex");
        const seed = `${event.tenantId}:${event.eventType}:${event.aggregateId || ""}:${payloadHash}`;
        eventId = createHash("sha256").update(seed).digest("hex").substring(0, 32);
        // Format as UUID v4
        eventId = `${eventId.substring(0, 8)}-${eventId.substring(8, 12)}-4${eventId.substring(13, 16)}-${eventId.substring(16, 20)}-${eventId.substring(20, 32)}`;
      }

      // Check if event already exists (idempotency check)
      const existing = await prisma.eventLog.findUnique({
        where: { eventId },
      });

      if (existing) {
        // Event already published, mark outbox as published
        await prisma.outboxEvent.update({
          where: { id: event.id },
          data: {
            status: "published",
            publishedAt: new Date(),
          },
        });
        skipped++;
        continue;
      }

      // Extract headers from payload (traceId, correlationId, actorUserId)
      const payload = event.payload as any;
      const headers = {
        traceId: payload.traceId || null,
        correlationId: payload.correlationId || null,
        actorUserId: payload.actorUserId || null,
        tenantId: event.tenantId,
      };

      // Redact payload for privacy
      const payloadRedacted = redactPayload(payload);

      // Calculate payload hash
      const payloadHash = createHash("sha256")
        .update(JSON.stringify(payload))
        .digest("hex");

      // Publish to event_log
      await prisma.$transaction(async (tx) => {
        // Create event log entry
        await tx.eventLog.create({
          data: {
            eventId,
            tenantId: event.tenantId,
            schemaId,
            schemaVersion: version,
            headers,
            payloadRedacted,
            payloadHash,
            publishedAt: new Date(),
          },
        });

        // Update outbox status
        await tx.outboxEvent.update({
          where: { id: event.id },
          data: {
            status: "published",
            publishedAt: new Date(),
          },
        });
      });

      processed++;
    } catch (error) {
      console.error(`Error relaying event ${event.id}:`, error);

      // Increment attempts and update error
      const attempts = event.attempts + 1;
      const shouldMoveToDLQ = attempts >= MAX_ATTEMPTS;

      await prisma.$transaction(async (tx) => {
        if (shouldMoveToDLQ) {
          // Try to create a minimal event log entry for DLQ reference
          // If we can't parse the event type, use a generic schema
          let schemaId = "unknown";
          let version = "v1";
          try {
            const parsed = parseEventType(event.eventType);
            schemaId = parsed.schemaId;
            version = parsed.version;
          } catch {
            // Use generic schema if parsing fails
            schemaId = "system.error";
          }

          // Create event log entry for DLQ reference (even if incomplete)
          const eventLog = await tx.eventLog.create({
            data: {
              eventId: randomUUID(),
              tenantId: event.tenantId,
              schemaId,
              schemaVersion: version,
              headers: {},
              payloadRedacted: redactPayload(event.payload),
              payloadHash: createHash("sha256")
                .update(JSON.stringify(event.payload))
                .digest("hex"),
              publishedAt: new Date(),
            },
          });

          // Create DLQ message
          await tx.dLQMessage.create({
            data: {
              consumerName: "outbox-relay",
              eventId: eventLog.eventId,
              sequence: eventLog.sequence,
              failureReason: error instanceof Error ? error.message : String(error),
              payloadSnapshot: event.payload as any,
            },
          });

          // Mark outbox as failed
          await tx.outboxEvent.update({
            where: { id: event.id },
            data: {
              status: "failed",
              attempts,
              lastError: error instanceof Error ? error.message : String(error),
            },
          });
        } else {
          // Retry later with exponential backoff
          await tx.outboxEvent.update({
            where: { id: event.id },
            data: {
              attempts,
              lastError: error instanceof Error ? error.message : String(error),
            },
          });
        }
      });

      failed++;
    }
  }

  return { processed, failed, skipped };
}

/**
 * Get relay metrics for observability
 */
export async function getRelayMetrics(): Promise<{
  pendingCount: number;
  publishedCount: number;
  failedCount: number;
  dlqCount: number;
  avgLagMs: number;
}> {
  const [pending, published, failed, dlq] = await Promise.all([
    prisma.outboxEvent.count({ where: { status: "pending" } }),
    prisma.outboxEvent.count({ where: { status: "published" } }),
    prisma.outboxEvent.count({ where: { status: "failed" } }),
    prisma.dLQMessage.count({ where: { consumerName: "outbox-relay" } }),
  ]);

  // Calculate average lag (time between occurredAt and publishedAt)
  const recentPublished = await prisma.outboxEvent.findMany({
    where: {
      status: "published",
      publishedAt: { not: null },
      occurredAt: { not: null },
    },
    take: 100,
    select: {
      occurredAt: true,
      publishedAt: true,
    },
  });

  const avgLagMs =
    recentPublished.length > 0
      ? recentPublished.reduce((sum, e) => {
          if (e.publishedAt && e.occurredAt) {
            return sum + (e.publishedAt.getTime() - e.occurredAt.getTime());
          }
          return sum;
        }, 0) / recentPublished.length
      : 0;

  return {
    pendingCount: pending,
    publishedCount: published,
    failedCount: failed,
    dlqCount: dlq,
    avgLagMs: Math.round(avgLagMs),
  };
}

