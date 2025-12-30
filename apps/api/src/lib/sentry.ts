/**
 * Sentry Integration
 * Error tracking and performance monitoring
 */

import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

let initialized = false;

/**
 * Initialize Sentry
 */
export function initializeSentry() {
  if (initialized) {
    console.warn("Sentry already initialized");
    return;
  }

  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    console.log("Sentry DSN not configured, skipping initialization");
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    integrations: [
      nodeProfilingIntegration(),
      Sentry.httpIntegration(),
      Sentry.prismaIntegration(),
    ],
    beforeSend(event, hint) {
      // Redact PII from error messages
      if (event.message) {
        event.message = redactPII(event.message);
      }

      if (event.exception) {
        event.exception.values?.forEach((exception) => {
          if (exception.value) {
            exception.value = redactPII(exception.value);
          }
        });
      }

      // Redact sensitive data from extra context
      if (event.extra) {
        event.extra = redactObject(event.extra);
      }

      return event;
    },
  });

  initialized = true;
  console.log("Sentry initialized");
}

/**
 * Redact PII from strings
 */
function redactPII(text: string): string {
  // Email pattern
  text = text.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, "[EMAIL_REDACTED]");
  
  // Phone pattern (US format)
  text = text.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, "[PHONE_REDACTED]");
  
  // SSN pattern
  text = text.replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[SSN_REDACTED]");
  
  // Credit card pattern
  text = text.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, "[CARD_REDACTED]");
  
  return text;
}

/**
 * Redact PII from objects
 */
function redactObject(obj: any): any {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(redactObject);
  }

  const redacted: any = {};
  const sensitiveKeys = ["password", "passwordHash", "token", "secret", "apiKey", "email", "phone", "ssn"];

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some((sk) => lowerKey.includes(sk))) {
      redacted[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      redacted[key] = redactObject(value);
    } else if (typeof value === "string") {
      redacted[key] = redactPII(value);
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
}

/**
 * Set user context for Sentry
 */
export function setUserContext(userId: string, email?: string, tenantId?: string) {
  Sentry.setUser({
    id: userId,
    email: email ? "[REDACTED]" : undefined, // Don't send email to Sentry
    ip_address: undefined, // Don't track IP
  });

  if (tenantId) {
    Sentry.setTag("tenant_id", tenantId);
  }
}

/**
 * Set context for current scope
 */
export function setContext(key: string, context: Record<string, any>) {
  Sentry.setContext(key, redactObject(context));
}

/**
 * Capture exception
 */
export function captureException(error: Error, context?: Record<string, any>) {
  if (context) {
    setContext("error_context", context);
  }
  Sentry.captureException(error);
}

/**
 * Capture message
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = "error", context?: Record<string, any>) {
  if (context) {
    setContext("message_context", context);
  }
  Sentry.captureMessage(redactPII(message), level);
}

/**
 * Start a transaction for performance monitoring
 */
export function startTransaction(name: string, op: string): Sentry.Transaction {
  return Sentry.startTransaction({ name, op });
}

/**
 * Wrap async function with error capture
 */
export function withErrorCapture<T>(
  fn: () => Promise<T>,
  context?: Record<string, any>
): Promise<T> {
  return Sentry.startSpan(
    {
      name: "operation",
      op: "function",
    },
    async () => {
      try {
        if (context) {
          setContext("operation_context", context);
        }
        return await fn();
      } catch (error) {
        captureException(error instanceof Error ? error : new Error(String(error)), context);
        throw error;
      }
    }
  );
}

