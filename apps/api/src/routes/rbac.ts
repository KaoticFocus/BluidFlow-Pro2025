import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { HTTPException } from "hono/http-exception";
import { AssignRolesSchema, PERMISSIONS } from "@buildflow/shared";
import { authMiddleware, tenantMiddleware, requirePermission } from "../middleware/auth";
import { createOutboxEvent, FOUNDATION_EVENTS } from "../lib/outbox";
import { prisma } from "../lib/prisma";

const rbac = new Hono();

// All routes require authentication and tenant context
rbac.use("*", authMiddleware, tenantMiddleware);

/**
 * GET /rbac/roles
 * List roles available in the current tenant
 */
rbac.get("/roles", async (c) => {
  const authCtx = c.get("auth");
  const tenantId = authCtx.tenantId!;

  const roles = await prisma.role.findMany({
    where: {
      OR: [
        { tenantId: null, isSystem: true }, // System roles
        { tenantId }, // Tenant-specific roles
      ],
    },
    include: {
      rolePermissions: {
        include: {
          permission: true,
        },
      },
    },
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
  });

  const formattedRoles = roles.map((role) => ({
    id: role.id,
    key: role.key,
    name: role.name,
    description: role.description,
    isSystem: role.isSystem,
    permissions: role.rolePermissions.map((rp) => rp.permission),
  }));

  return c.json({ roles: formattedRoles });
});

/**
 * GET /rbac/permissions
 * List all available permissions
 */
rbac.get("/permissions", async (c) => {
  const permissions = await prisma.permission.findMany({
    orderBy: [{ category: "asc" }, { key: "asc" }],
  });

  return c.json({ permissions });
});

/**
 * POST /rbac/assign
 * Assign roles to a user
 */
rbac.post(
  "/assign",
  requirePermission(PERMISSIONS.USERS_MANAGE),
  zValidator("json", AssignRolesSchema),
  async (c) => {
    const authCtx = c.get("auth");
    const tenantId = authCtx.tenantId!;
    const input = c.req.valid("json");

    // Get membership
    const membership = await prisma.tenantMembership.findUnique({
      where: {
        tenantId_userId: {
          tenantId,
          userId: input.userId,
        },
      },
      include: {
        roles: { include: { role: true } },
      },
    });

    if (!membership) {
      throw new HTTPException(404, { message: "User is not a member of this tenant" });
    }

    // Verify all roles exist and are valid for this tenant
    const validRoles = await prisma.role.findMany({
      where: {
        id: { in: input.roleIds },
        OR: [{ tenantId: null }, { tenantId }],
      },
    });

    if (validRoles.length !== input.roleIds.length) {
      throw new HTTPException(400, { message: "One or more invalid role IDs" });
    }

    const previousRoleIds = membership.roles.map((r) => r.roleId);

    await prisma.$transaction(async (tx) => {
      // Remove existing roles
      await tx.membershipRole.deleteMany({
        where: { membershipId: membership.id },
      });

      // Assign new roles
      await tx.membershipRole.createMany({
        data: input.roleIds.map((roleId) => ({
          membershipId: membership.id,
          roleId,
        })),
      });

      // Emit event
      await tx.outboxEvent.create({
        data: createOutboxEvent({
          tenantId,
          eventType: FOUNDATION_EVENTS.MEMBER_ROLES_CHANGED,
          aggregateId: membership.id,
          actorUserId: authCtx.user.id,
          payload: {
            membershipId: membership.id,
            userId: input.userId,
            previousRoleIds,
            newRoleIds: input.roleIds,
          },
        }),
      });
    });

    return c.body(null, 204);
  }
);

/**
 * GET /rbac/my-permissions
 * Get current user's computed permissions for the active tenant
 */
rbac.get("/my-permissions", async (c) => {
  const authCtx = c.get("auth");

  return c.json({
    permissions: Array.from(authCtx.permissions),
    isPlatformAdmin: authCtx.user.isPlatformAdmin,
  });
});

export { rbac };

