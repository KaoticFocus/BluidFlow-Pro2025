import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import { validateSupabaseToken } from "../lib/supabase-server";
import { getOrCreateUserFromSupabase } from "../lib/supabase-sync";
import { prisma } from "../lib/prisma";

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
 * Validates Supabase JWT token and populates auth context with Prisma data
 */
export async function authMiddleware(c: Context, next: Next) {
  // Get token from cookie or Authorization header
  const cookieToken = c.req.header("Cookie")?.match(/session=([^;]+)/)?.[1];
  const bearerToken = c.req.header("Authorization")?.replace("Bearer ", "");
  const token = cookieToken || bearerToken;

  if (!token) {
    throw new HTTPException(401, { message: "Authentication required" });
  }

  // Validate Supabase JWT token
  const supabaseUser = await validateSupabaseToken(token);
  
  if (!supabaseUser) {
    throw new HTTPException(401, { message: "Invalid or expired session" });
  }

  // Sync user to Prisma (ensures they exist in our database)
  const user = await getOrCreateUserFromSupabase(supabaseUser);

  // Get tenant from header or find user's first active tenant
  const headerTenantId = c.req.header("X-Tenant-ID");
  let tenantId = headerTenantId || null;

  // If no tenant in header, get user's first active membership
  if (!tenantId) {
    const membership = await prisma.tenantMembership.findFirst({
      where: {
        userId: user.id,
        status: "active",
      },
      select: { tenantId: true },
    });
    tenantId = membership?.tenantId || null;
  }

  // Load user permissions for the tenant
  const permissions = tenantId 
    ? await loadUserPermissions(user.id, tenantId)
    : new Set<string>();

  // Create a session-like object (Supabase handles sessions, but we track tenant context)
  const authContext: AuthContext = {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      isPlatformAdmin: user.isPlatformAdmin,
    },
    session: {
      id: supabaseUser.id, // Use Supabase user ID as session ID
      userId: user.id,
      activeTenantId: tenantId,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days (Supabase manages expiry)
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
      const supabaseUser = await validateSupabaseToken(token);
      if (supabaseUser) {
        const user = await getOrCreateUserFromSupabase(supabaseUser);
        const headerTenantId = c.req.header("X-Tenant-ID");
        
        // Get user's first active tenant if no header
        let tenantId = headerTenantId || null;
        if (!tenantId) {
          const membership = await prisma.tenantMembership.findFirst({
            where: { userId: user.id, status: "active" },
            select: { tenantId: true },
          });
          tenantId = membership?.tenantId || null;
        }

        const permissions = tenantId 
          ? await loadUserPermissions(user.id, tenantId)
          : new Set<string>();

        c.set("auth", {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            isPlatformAdmin: user.isPlatformAdmin,
          },
          session: {
            id: supabaseUser.id,
            userId: user.id,
            activeTenantId: tenantId,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
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
// PRISMA-BASED IMPLEMENTATIONS
// ============================================================================

/**
 * Load user permissions for a tenant
 * Queries: membership -> roles -> role_permissions -> permissions
 * Also considers permission_overrides
 */
async function loadUserPermissions(userId: string, tenantId: string): Promise<Set<string>> {
  // Get user's membership in this tenant
  const membership = await prisma.tenantMembership.findUnique({
    where: {
      tenantId_userId: {
        tenantId,
        userId,
      },
    },
    include: {
      roles: {
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
      permissionOverrides: {
        include: {
          permission: true,
        },
      },
    },
  });

  if (!membership) {
    return new Set<string>();
  }

  const permissions = new Set<string>();

  // Add permissions from roles
  for (const membershipRole of membership.roles) {
    for (const rolePermission of membershipRole.role.rolePermissions) {
      permissions.add(rolePermission.permission.key);
    }
  }

  // Apply permission overrides (deny takes precedence)
  for (const override of membership.permissionOverrides) {
    if (override.granted) {
      permissions.add(override.permission.key);
    } else {
      permissions.delete(override.permission.key);
    }
  }

  return permissions;
}

/**
 * Verify user has active membership in tenant
 */
async function verifyTenantMembership(userId: string, tenantId: string): Promise<boolean> {
  const membership = await prisma.tenantMembership.findUnique({
    where: {
      tenantId_userId: {
        tenantId,
        userId,
      },
    },
  });

  return membership?.status === "active" || false;
}

export {
  loadUserPermissions,
  verifyTenantMembership,
};
