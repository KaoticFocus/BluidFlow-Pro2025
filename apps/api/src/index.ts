import { Hono } from "hono";
import type { Context } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { HTTPException } from "hono/http-exception";
import { initializeOpenTelemetry, shutdownOpenTelemetry } from "./lib/otel";
import { initializeSentry, captureException, setUserContext, setContext } from "./lib/sentry";
import { logger } from "./lib/logger";

// Routes
import { auth } from "./routes/auth";
import { tenants, publicTenants } from "./routes/tenants";
import { rbac } from "./routes/rbac";
import { ai } from "./routes/ai";
import { consents } from "./routes/consents";
import { taskflowRoutes } from "./routes/taskflow";
import { meetings } from "./routes/meetings";
import { internalEvents } from "./routes/internal/events";

const app = new Hono();

// ============================================================================
// Observability Initialization
// ============================================================================

// Initialize Sentry (error tracking)
initializeSentry();

// Initialize OpenTelemetry (only if enabled)
initializeOpenTelemetry();

// ============================================================================
// Global Middleware
// ============================================================================

// Logging
app.use("*", logger());

// Security headers
app.use("*", secureHeaders());

// CORS
app.use(
  "*",
  cors({
    origin: (origin) => {
      // Allow localhost for development
      if (origin?.includes("localhost") || origin?.includes("127.0.0.1")) {
        return origin;
      }
      // Add production origins here
      return null;
    },
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Tenant-ID", "X-Idempotency-Key"],
  })
);

// ============================================================================
// Health Check
// ============================================================================

app.get("/", (c: Context) => {
  return c.json({
    name: "BuildFlow Pro API",
    version: "1.0.0",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (c: Context) => {
  return c.json({ status: "ok" });
});

// ============================================================================
// API Routes
// ============================================================================

// Auth routes (some public, some protected)
app.route("/auth", auth);

// Public tenant routes (accept invite)
app.route("/tenants", publicTenants);

// Protected tenant routes
app.route("/tenants", tenants);

// RBAC routes
app.route("/rbac", rbac);

// AI Action routes
app.route("/ai", ai);

// Consent routes
app.route("/consents", consents);

// TaskFlow routes
app.route("/v1/taskflow", taskflowRoutes);

// MeetingFlow routes
app.route("/v1/meetings", meetings);

// Internal service routes (require service auth)
app.route("/internal", internalEvents);

// ============================================================================
// Error Handling
// ============================================================================

app.onError((err, c) => {
  console.error("API Error:", err);

  if (err instanceof HTTPException) {
    return c.json(
      {
        error: {
          message: err.message,
          status: err.status,
        },
      },
      err.status
    );
  }

  // Don't expose internal errors in production
  const message =
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message;

  return c.json(
    {
      error: {
        message,
        status: 500,
      },
    },
    500
  );
});

// ============================================================================
// 404 Handler
// ============================================================================

app.notFound((c) => {
  return c.json(
    {
      error: {
        message: "Not found",
        status: 404,
      },
    },
    404
  );
});

// ============================================================================
// Export
// ============================================================================

export default app;

// ============================================================================
// Workers
// ============================================================================

// Start workers in development (in production, run as separate process)
if (process.env.NODE_ENV === "development" && process.env.START_WORKERS !== "false") {
  import("./workers").then(({ startWorkers }) => {
    startWorkers().catch((error) => {
      console.error("Failed to start workers:", error);
    });
  });
}

// For local development with Node.js
const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;

// Check for Bun runtime (using type guard to avoid type errors)
if (typeof globalThis !== "undefined" && "Bun" in globalThis) {
  // Running with Bun
  console.log(`🚀 Server running at http://localhost:${port}`);
} else {
  // Running with Node.js - use serve from @hono/node-server
  console.log(`📡 API ready on port ${port}`);
}

export { app };
