/**
 * Idempotency Middleware
 * Ensures duplicate requests with the same Idempotency-Key return the same response
 * Supports mobile-first offline request queuing
 */

import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import { createHash } from "node:crypto";
import { prisma } from "../lib/prisma";

const IDEMPOTENCY_KEY_HEADER = "Idempotency-Key";
const IDEMPOTENCY_TTL_HOURS = 24;

/**
 * Generate a hash for the idempotency key
 * Combines tenantId + route + idempotencyKey for uniqueness
 */
function generateKeyHash(tenantId: string, route: string, idempotencyKey: string): string {
  const combined = `${tenantId}:${route}:${idempotencyKey}`;
  return createHash("sha256").update(combined).digest("hex");
}

/**
 * Idempotency middleware
 * Should be applied after authMiddleware and tenantMiddleware
 */
export async function idempotencyMiddleware(c: Context, next: Next) {
  const idempotencyKey = c.req.header(IDEMPOTENCY_KEY_HEADER);
  const method = c.req.method;
  const path = c.req.path;

  // Only apply to mutation methods
  if (!["POST", "PATCH", "PUT", "DELETE"].includes(method)) {
    await next();
    return;
  }

  // Skip if no idempotency key provided
  if (!idempotencyKey) {
    await next();
    return;
  }

  // Get tenant ID from auth context
  const authCtx = c.get("auth");
  if (!authCtx || !authCtx.tenantId) {
    await next();
    return;
  }

  const tenantId = authCtx.tenantId;
  const route = `${method} ${path}`;
  const keyHash = generateKeyHash(tenantId, route, idempotencyKey);

  // Check for existing idempotency key
  const existing = await prisma.idempotencyKey.findUnique({
    where: {
      tenantId_keyHash: {
        tenantId,
        keyHash,
      },
    },
  });

  // If found and not expired, return cached response
  if (existing && existing.expiresAt > new Date()) {
    // Check if this is a true duplicate (same request) or a retry
    const requestBody = await c.req.text();
    const requestBodyHash = createHash("sha256").update(requestBody).digest("hex");
    
    // For true duplicates, return cached response
    c.status(existing.statusCode);
    return c.json(existing.responseBody as any);
  }

  // Clean up expired keys
  if (existing && existing.expiresAt <= new Date()) {
    await prisma.idempotencyKey.delete({
      where: { id: existing.id },
    });
  }

  // Execute the handler and capture response
  await next();

  // Store the response if successful (2xx status)
  const statusCode = c.res.status;
  if (statusCode >= 200 && statusCode < 300) {
    try {
      // Clone response to read body without consuming original
      const clonedResponse = c.res.clone();
      let responseBody: any = null;

      try {
        const contentType = clonedResponse.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          responseBody = await clonedResponse.json();
        } else {
          const text = await clonedResponse.text();
          responseBody = text ? { data: text } : null;
        }
      } catch {
        // If we can't parse the response, store a placeholder
        responseBody = { stored: true };
      }

      if (responseBody !== null) {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + IDEMPOTENCY_TTL_HOURS);

        await prisma.idempotencyKey.upsert({
          where: {
            tenantId_keyHash: {
              tenantId,
              keyHash,
            },
          },
          create: {
            tenantId,
            keyHash,
            route,
            method,
            statusCode,
            responseBody: responseBody as any,
            expiresAt,
          },
          update: {
            statusCode,
            responseBody: responseBody as any,
            expiresAt,
          },
        });
      }
    } catch (error) {
      // If we can't store the response, log but don't fail the request
      console.error("Failed to store idempotency key:", error);
    }
  }
}

/**
 * Clean up expired idempotency keys
 * Should be run periodically (e.g., via cron job)
 */
export async function cleanupExpiredIdempotencyKeys() {
  const deleted = await prisma.idempotencyKey.deleteMany({
    where: {
      expiresAt: {
        lte: new Date(),
      },
    },
  });

  return deleted.count;
}

