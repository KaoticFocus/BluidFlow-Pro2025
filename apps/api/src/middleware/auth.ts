import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";

// Types for auth context
export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  isPlatformAdmin: boolean;
}

export interface AuthSession {
  id: string;
  userId: string;
  activeTenantId: string | null;
  expiresAt: Date;
}

export interface AuthContext {
  user: AuthUser;
  session: AuthSession;
  tenantId: string | null;
  permissions: Set<string>;
}

// Extend Hono context with auth
declare module "hono" {
  interface ContextVariableMap {
    auth: AuthContext;
  }
}

/**
 * Authentication middleware
 * Validates session token and populates auth context
 */
export async function authMiddleware(c: Context, next: Next) {
  // Get token from cookie or Authorization header
  const cookieToken = c.req.header("Cookie")?.match(/session=([^;]+)/)?.[1];
  const bearerToken = c.req.header("Authorization")?.replace("Bearer ", "");
  const token = cookieToken || bearerToken;

  if (!token) {
    throw new HTTPException(401, { message: "Authentication required" });
  }

  // TODO: Replace with actual database lookup via Prisma
  // For now, return a placeholder that will be replaced with real implementation
  const session = await validateSessionToken(token);
  
  if (!session) {
    throw new HTTPException(401, { message: "Invalid or expired session" });
  }

  // Get tenant from header or session
  const headerTenantId = c.req.header("X-Tenant-ID");
  const tenantId = headerTenantId || session.activeTenantId;

  // Load user permissions for the tenant
  const permissions = tenantId 
    ? await loadUserPermissions(session.userId, tenantId)
    : new Set<string>();

  const authContext: AuthContext = {
    user: session.user,
    session: {
      id: session.id,
      userId: session.userId,
      activeTenantId: session.activeTenantId,
      expiresAt: session.expiresAt,
    },
    tenantId,
    permissions,
  };

  c.set("auth", authContext);

  await next();
}

/**
 * Tenant isolation middleware
 * Ensures request has a valid tenant context
 */
export async function tenantMiddleware(c: Context, next: Next) {
  const auth = c.get("auth");

  if (!auth) {
    throw new HTTPException(401, { message: "Authentication required" });
  }

  if (!auth.tenantId) {
    throw new HTTPException(400, { 
      message: "Tenant context required. Provide X-Tenant-ID header or switch to a tenant." 
    });
  }

  // Verify user has membership in this tenant
  const hasMembership = await verifyTenantMembership(auth.user.id, auth.tenantId);
  
  if (!hasMembership && !auth.user.isPlatformAdmin) {
    throw new HTTPException(403, { message: "Access denied to this tenant" });
  }

  await next();
}

/**
 * Permission check middleware factory
 */
export function requirePermission(...requiredPermissions: string[]) {
  return async (c: Context, next: Next) => {
    const auth = c.get("auth");

    if (!auth) {
      throw new HTTPException(401, { message: "Authentication required" });
    }

    // Platform admins bypass permission checks
    if (auth.user.isPlatformAdmin) {
      return next();
    }

    const hasAllPermissions = requiredPermissions.every(
      (perm) => auth.permissions.has(perm)
    );

    if (!hasAllPermissions) {
      throw new HTTPException(403, {
        message: `Missing required permissions: ${requiredPermissions.join(", ")}`,
      });
    }

    await next();
  };
}

/**
 * Optional auth middleware - sets auth context if available but doesn't require it
 */
export async function optionalAuthMiddleware(c: Context, next: Next) {
  try {
    const cookieToken = c.req.header("Cookie")?.match(/session=([^;]+)/)?.[1];
    const bearerToken = c.req.header("Authorization")?.replace("Bearer ", "");
    const token = cookieToken || bearerToken;

    if (token) {
      const session = await validateSessionToken(token);
      if (session) {
        const tenantId = c.req.header("X-Tenant-ID") || session.activeTenantId;
        const permissions = tenantId 
          ? await loadUserPermissions(session.userId, tenantId)
          : new Set<string>();

        c.set("auth", {
          user: session.user,
          session: {
            id: session.id,
            userId: session.userId,
            activeTenantId: session.activeTenantId,
            expiresAt: session.expiresAt,
          },
          tenantId,
          permissions,
        });
      }
    }
  } catch {
    // Ignore auth errors for optional auth
  }

  await next();
}

// ============================================================================
// PLACEHOLDER FUNCTIONS - Replace with Prisma implementation
// ============================================================================

interface SessionWithUser {
  id: string;
  userId: string;
  activeTenantId: string | null;
  expiresAt: Date;
  user: AuthUser;
}

async function validateSessionToken(token: string): Promise<SessionWithUser | null> {
  // TODO: Implement actual session validation with Prisma
  // This is a placeholder that will be replaced
  console.log("validateSessionToken called with:", token.substring(0, 10) + "...");
  return null;
}

async function loadUserPermissions(userId: string, tenantId: string): Promise<Set<string>> {
  // TODO: Implement actual permission loading with Prisma
  // Query: membership -> roles -> role_permissions -> permissions
  // Also consider permission_overrides
  console.log("loadUserPermissions called for:", userId, tenantId);
  return new Set<string>();
}

async function verifyTenantMembership(userId: string, tenantId: string): Promise<boolean> {
  // TODO: Implement actual membership verification with Prisma
  console.log("verifyTenantMembership called for:", userId, tenantId);
  return false;
}

export {
  validateSessionToken,
  loadUserPermissions,
  verifyTenantMembership,
};

