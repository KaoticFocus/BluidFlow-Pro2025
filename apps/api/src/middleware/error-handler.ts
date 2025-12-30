/**
 * Error Handler Middleware
 * Captures errors and sends to Sentry with proper context
 */

import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import { captureException, setUserContext, setContext } from "../lib/sentry";
import { logger } from "../lib/logger";

/**
 * Error handler middleware
 * Should be applied after all routes
 */
export async function errorHandlerMiddleware(c: Context, next: Next) {
  try {
    await next();
  } catch (error) {
    // Get auth context if available
    const authCtx = c.get("auth") as { user?: { id: string }; tenantId?: string } | undefined;

    // Set Sentry context
    if (authCtx) {
      if (authCtx.user?.id) {
        setUserContext(authCtx.user.id, undefined, authCtx.tenantId || undefined);
      }
      if (authCtx.tenantId) {
        setContext("request", {
          tenantId: authCtx.tenantId,
          path: c.req.path,
          method: c.req.method,
        });
      }
    }

    // Log error
    logger.error("Request error", error, {
      path: c.req.path,
      method: c.req.method,
      status: error instanceof HTTPException ? error.status : 500,
    });

    // Capture in Sentry (only for non-HTTP exceptions or 5xx errors)
    if (!(error instanceof HTTPException) || error.status >= 500) {
      captureException(error instanceof Error ? error : new Error(String(error)), {
        path: c.req.path,
        method: c.req.method,
        status: error instanceof HTTPException ? error.status : 500,
      });
    }

    // Re-throw to let Hono's error handler process it
    throw error;
  }
}

