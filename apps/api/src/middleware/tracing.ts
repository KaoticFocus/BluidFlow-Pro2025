/**
 * Tracing Middleware
 * Adds OpenTelemetry spans to route handlers
 */

import type { Context, Next } from "hono";
import { withSpan, addSpanAttributes } from "../lib/otel";

/**
 * Tracing middleware for route handlers
 * Should be applied after authMiddleware to have access to user context
 */
export async function tracingMiddleware(c: Context, next: Next) {
  const method = c.req.method;
  const path = c.req.path;
  const route = `${method} ${path}`;

  // Get auth context if available
  const authCtx = c.get("auth") as { user?: { id: string }; tenantId?: string } | undefined;

  return await withSpan(
    `http.${method.toLowerCase()}`,
    async (span) => {
      // Add route attributes
      span.setAttributes({
        "http.method": method,
        "http.route": path,
        "http.target": c.req.url,
      });

      // Add user context if available
      if (authCtx) {
        if (authCtx.tenantId) {
          span.setAttribute("tenant.id", authCtx.tenantId);
        }
        if (authCtx.user?.id) {
          span.setAttribute("user.id", authCtx.user.id);
        }
      }

      // Add request ID if present
      const requestId = c.req.header("X-Request-ID");
      if (requestId) {
        span.setAttribute("request.id", requestId);
      }

      // Execute handler
      const startTime = Date.now();
      await next();
      const duration = Date.now() - startTime;

      // Add response attributes
      span.setAttributes({
        "http.status_code": c.res.status,
        "http.response.duration_ms": duration,
      });

      // Set status based on HTTP status code
      if (c.res.status >= 400) {
        span.setStatus({
          code: c.res.status >= 500 ? 2 : 1, // ERROR or UNSET
        });
      }
    },
    {
      "http.method": method,
      "http.route": path,
    }
  );
}

