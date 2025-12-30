/**
 * Service Authentication Middleware
 * Authenticates internal service-to-service requests using service tokens and HMAC
 */

import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import { createHmac } from "node:crypto";

const SERVICE_TOKEN_HEADER = "X-Service-Token";
const SERVICE_SIGNATURE_HEADER = "X-Service-Signature";
const SERVICE_NAME_HEADER = "X-Service-Name";

interface ServiceAuthContext {
  serviceName: string;
  serviceToken: string;
}

/**
 * Verify service token and HMAC signature
 */
async function verifyServiceAuth(
  serviceToken: string,
  serviceName: string,
  signature: string,
  body: string
): Promise<boolean> {
  // In production, validate against database or secret manager
  // For now, check against environment variable
  const expectedToken = process.env[`SERVICE_TOKEN_${serviceName.toUpperCase()}`] || process.env.SERVICE_TOKEN;

  if (!expectedToken || serviceToken !== expectedToken) {
    return false;
  }

  // Verify HMAC signature
  const secret = process.env[`SERVICE_SECRET_${serviceName.toUpperCase()}`] || process.env.SERVICE_SECRET || "";
  const expectedSignature = createHmac("sha256", secret).update(body).digest("hex");

  // Use constant-time comparison to prevent timing attacks
  if (signature.length !== expectedSignature.length) {
    return false;
  }

  let match = 0;
  for (let i = 0; i < signature.length; i++) {
    match |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
  }

  return match === 0;
}

/**
 * Service authentication middleware
 * Requires X-Service-Token, X-Service-Signature, and X-Service-Name headers
 */
export async function serviceAuthMiddleware(c: Context, next: Next) {
  const serviceToken = c.req.header(SERVICE_TOKEN_HEADER);
  const signature = c.req.header(SERVICE_SIGNATURE_HEADER);
  const serviceName = c.req.header(SERVICE_NAME_HEADER);

  if (!serviceToken || !signature || !serviceName) {
    throw new HTTPException(401, {
      message: "Missing service authentication headers",
    });
  }

  // Get request body for signature verification
  const body = await c.req.text();
  
  // Clone request so body can be read again
  const clonedReq = c.req.clone();
  const verified = await verifyServiceAuth(serviceToken, serviceName, signature, body);

  if (!verified) {
    throw new HTTPException(401, {
      message: "Invalid service authentication",
    });
  }

  // Store service context
  c.set("serviceAuth", {
    serviceName,
    serviceToken,
  } as ServiceAuthContext);

  await next();
}

/**
 * Check if request has specific scope
 * For now, we'll use a simple scope check
 */
export function requireScope(scope: string) {
  return async (c: Context, next: Next) => {
    const serviceAuth = c.get("serviceAuth") as ServiceAuthContext | undefined;

    if (!serviceAuth) {
      throw new HTTPException(401, {
        message: "Service authentication required",
      });
    }

    // In production, check scope from database or token claims
    // For now, allow all authenticated services
    await next();
  };
}

