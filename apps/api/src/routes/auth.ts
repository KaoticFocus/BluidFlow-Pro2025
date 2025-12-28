import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { HTTPException } from "hono/http-exception";
import { SignupSchema, SigninSchema, SwitchTenantSchema } from "@buildflow/shared";
import { hashPassword, verifyPassword, generateSessionToken } from "../lib/password";
import { generateUniqueSlug } from "../lib/slug";
import { createOutboxEvent, FOUNDATION_EVENTS } from "../lib/outbox";
import { authMiddleware } from "../middleware/auth";

const auth = new Hono();

/**
 * POST /auth/signup
 * Create a new user and tenant
 */
auth.post("/signup", zValidator("json", SignupSchema), async (c) => {
  const input = c.req.valid("json");

  // TODO: Replace with Prisma transaction
  // This is a scaffold showing the intended flow

  // 1. Check if email already exists
  // const existingUser = await prisma.user.findUnique({ where: { email: input.email } });
  // if (existingUser) throw new HTTPException(409, { message: "Email already registered" });

  // 2. Hash password
  const passwordHash = hashPassword(input.password);

  // 3. Generate tenant slug
  const tenantSlug = generateUniqueSlug(input.tenantName);

  // 4. Create user, tenant, membership, and assign owner role in transaction
  /*
  const result = await prisma.$transaction(async (tx) => {
    // Create user
    const user = await tx.user.create({
      data: {
        email: input.email,
        passwordHash,
        name: input.name,
        status: "active",
      },
    });

    // Create tenant
    const tenant = await tx.tenant.create({
      data: {
        name: input.tenantName,
        slug: tenantSlug,
        ownerUserId: user.id,
      },
    });

    // Create membership
    const membership = await tx.tenantMembership.create({
      data: {
        tenantId: tenant.id,
        userId: user.id,
        status: "active",
      },
    });

    // Get owner role and assign
    const ownerRole = await tx.role.findFirst({
      where: { key: "owner", isSystem: true },
    });
    if (ownerRole) {
      await tx.membershipRole.create({
        data: {
          membershipId: membership.id,
          roleId: ownerRole.id,
        },
      });
    }

    // Create session
    const sessionToken = generateSessionToken();
    const session = await tx.session.create({
      data: {
        userId: user.id,
        activeTenantId: tenant.id,
        token: sessionToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        ipAddress: c.req.header("X-Forwarded-For") || null,
        userAgent: c.req.header("User-Agent") || null,
      },
    });

    // Emit events via outbox
    await tx.outboxEvent.createMany({
      data: [
        createOutboxEvent({
          tenantId: tenant.id,
          eventType: FOUNDATION_EVENTS.USER_CREATED,
          aggregateId: user.id,
          payload: { userId: user.id, email: user.email, name: user.name },
        }),
        createOutboxEvent({
          tenantId: tenant.id,
          eventType: FOUNDATION_EVENTS.TENANT_CREATED,
          aggregateId: tenant.id,
          payload: { tenantId: tenant.id, name: tenant.name, slug: tenant.slug, ownerUserId: user.id },
        }),
      ],
    });

    return { user, tenant, session };
  });
  */

  // Placeholder response
  const sessionToken = generateSessionToken();
  
  return c.json({
    user: {
      id: "placeholder-user-id",
      email: input.email,
      name: input.name || null,
    },
    tenant: {
      id: "placeholder-tenant-id",
      name: input.tenantName,
      slug: tenantSlug,
    },
    session: {
      token: sessionToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
  }, 201);
});

/**
 * POST /auth/signin
 * Sign in with email and password
 */
auth.post("/signin", zValidator("json", SigninSchema), async (c) => {
  const input = c.req.valid("json");

  // TODO: Replace with Prisma implementation
  /*
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user || !user.passwordHash) {
    throw new HTTPException(401, { message: "Invalid email or password" });
  }

  if (user.status !== "active") {
    throw new HTTPException(403, { message: "Account is disabled" });
  }

  if (!verifyPassword(input.password, user.passwordHash)) {
    throw new HTTPException(401, { message: "Invalid email or password" });
  }

  // Get user's first tenant for default active tenant
  const membership = await prisma.tenantMembership.findFirst({
    where: { userId: user.id, status: "active" },
    include: { tenant: true },
  });

  const sessionToken = generateSessionToken();
  const session = await prisma.session.create({
    data: {
      userId: user.id,
      activeTenantId: membership?.tenantId || null,
      token: sessionToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      ipAddress: c.req.header("X-Forwarded-For") || null,
      userAgent: c.req.header("User-Agent") || null,
    },
  });

  // Emit sign-in event
  if (membership) {
    await prisma.outboxEvent.create({
      data: createOutboxEvent({
        tenantId: membership.tenantId,
        eventType: FOUNDATION_EVENTS.USER_SIGNED_IN,
        aggregateId: user.id,
        payload: {
          userId: user.id,
          sessionId: session.id,
          ipAddress: session.ipAddress,
          userAgent: session.userAgent,
        },
      }),
    });
  }
  */

  // Placeholder response
  const sessionToken = generateSessionToken();

  return c.json({
    session: {
      token: sessionToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
  });
});

/**
 * POST /auth/signout
 * Sign out current session
 */
auth.post("/signout", authMiddleware, async (c) => {
  const authCtx = c.get("auth");

  // TODO: Replace with Prisma implementation
  /*
  await prisma.session.update({
    where: { id: authCtx.session.id },
    data: { revokedAt: new Date() },
  });

  if (authCtx.tenantId) {
    await prisma.outboxEvent.create({
      data: createOutboxEvent({
        tenantId: authCtx.tenantId,
        eventType: FOUNDATION_EVENTS.USER_SIGNED_OUT,
        aggregateId: authCtx.user.id,
        payload: {
          userId: authCtx.user.id,
          sessionId: authCtx.session.id,
        },
      }),
    });
  }
  */

  return c.body(null, 204);
});

/**
 * POST /auth/refresh
 * Refresh session token
 */
auth.post("/refresh", authMiddleware, async (c) => {
  const authCtx = c.get("auth");

  // TODO: Replace with Prisma implementation
  /*
  const newToken = generateSessionToken();
  const session = await prisma.session.update({
    where: { id: authCtx.session.id },
    data: {
      token: newToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });
  */

  const newToken = generateSessionToken();

  return c.json({
    session: {
      token: newToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
  });
});

/**
 * GET /auth/session
 * Get current session info
 */
auth.get("/session", authMiddleware, async (c) => {
  const authCtx = c.get("auth");

  // TODO: Replace with Prisma implementation to get full membership info
  /*
  const memberships = await prisma.tenantMembership.findMany({
    where: { userId: authCtx.user.id, status: "active" },
    include: {
      tenant: { select: { id: true, name: true, slug: true } },
      roles: { include: { role: true } },
    },
  });

  let activeTenant = null;
  if (authCtx.tenantId) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: authCtx.tenantId },
      select: { id: true, name: true, slug: true },
    });
    activeTenant = tenant;
  }
  */

  return c.json({
    user: authCtx.user,
    activeTenant: authCtx.tenantId ? { id: authCtx.tenantId, name: "Unknown", slug: "unknown" } : null,
    memberships: [],
  });
});

/**
 * POST /auth/switch-tenant
 * Switch active tenant context
 */
auth.post("/switch-tenant", authMiddleware, zValidator("json", SwitchTenantSchema), async (c) => {
  const authCtx = c.get("auth");
  const input = c.req.valid("json");

  // TODO: Replace with Prisma implementation
  /*
  // Verify user has membership in target tenant
  const membership = await prisma.tenantMembership.findUnique({
    where: {
      tenantId_userId: {
        tenantId: input.tenantId,
        userId: authCtx.user.id,
      },
    },
    include: { tenant: true },
  });

  if (!membership && !authCtx.user.isPlatformAdmin) {
    throw new HTTPException(403, { message: "Access denied to this tenant" });
  }

  // Update session with new active tenant
  await prisma.session.update({
    where: { id: authCtx.session.id },
    data: { activeTenantId: input.tenantId },
  });
  */

  return c.json({
    activeTenant: {
      id: input.tenantId,
      name: "Unknown",
      slug: "unknown",
    },
  });
});

export { auth };

