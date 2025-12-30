import { Hono } from "hono";
import type { Context } from "hono";
import { zValidator } from "@hono/zod-validator";
import { HTTPException } from "hono/http-exception";
import { AssignRolesSchema, PERMISSIONS } from "../../../../packages/shared/src/rbac";
import { z } from "zod";
import { authMiddleware, tenantMiddleware, requirePermission } from "../middleware/auth";
import type { AuthContext } from "../middleware/auth";
import { createOutboxEvent, FOUNDATION_EVENTS } from "../lib/outbox";
import { prisma } from "../lib/prisma";

const rbac = new Hono();

// All routes require authentication and tenant context
rbac.use("*", authMiddleware, tenantMiddleware);

/**
 * GET /rbac/roles
 * List roles available in the current tenant
 */
rbac.get("/roles", async (c: Context) => {
  const authCtx = c.get("auth") as AuthContext;
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

  const formattedRoles = roles.map((role: any) => ({
    id: role.id,
    key: role.key,
    name: role.name,
    description: role.description,
    isSystem: role.isSystem,
    permissions: role.rolePermissions.map((rp: any) => rp.permission),
  }));

  return c.json({ roles: formattedRoles });
});

/**
 * GET /rbac/permissions
 * List all available permissions
 */
rbac.get("/permissions", async (c: Context) => {
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
  async (c: Context) => {
    const authCtx = c.get("auth") as AuthContext;
    const tenantId = authCtx.tenantId!;
    const input = c.req.valid("json") as z.infer<typeof AssignRolesSchema>;

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

    const previousRoleIds = membership.roles.map((r: any) => r.roleId);

    await prisma.$transaction(async (tx) => {
      // Remove existing roles
      await tx.membershipRole.deleteMany({
        where: { membershipId: membership.id },
      });

      // Assign new roles
      await tx.membershipRole.createMany({
        data: input.roleIds.map((roleId: string) => ({
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
 * POST /rbac/roles
 * Create a custom role for the tenant
 */
rbac.post(
  "/roles",
  requirePermission(PERMISSIONS.USERS_MANAGE),
  zValidator("json", z.object({
    key: z.string().min(1).max(50).regex(/^[a-z0-9_]+$/, "Key must be lowercase alphanumeric with underscores"),
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    permissionIds: z.array(z.string().uuid()).optional(),
  })),
  async (c: Context) => {
    const authCtx = c.get("auth") as AuthContext;
    const tenantId = authCtx.tenantId!;
    const input = c.req.valid("json") as {
      key: string;
      name: string;
      description?: string;
      permissionIds?: string[];
    };

    // Check if role key already exists for this tenant
    const existingRole = await prisma.role.findUnique({
      where: {
        tenantId_key: {
          tenantId,
          key: input.key,
        },
      },
    });

    if (existingRole) {
      throw new HTTPException(409, { message: `Role with key "${input.key}" already exists` });
    }

    // Verify all permissions exist
    if (input.permissionIds && input.permissionIds.length > 0) {
      const permissions = await prisma.permission.findMany({
        where: { id: { in: input.permissionIds } },
      });

      if (permissions.length !== input.permissionIds.length) {
        throw new HTTPException(400, { message: "One or more invalid permission IDs" });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create role
      const role = await tx.role.create({
        data: {
          tenantId,
          key: input.key,
          name: input.name,
          description: input.description || null,
          isSystem: false,
        },
      });

      // Assign permissions if provided
      if (input.permissionIds && input.permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: input.permissionIds.map((permissionId) => ({
            roleId: role.id,
            permissionId,
          })),
        });
      }

      // Emit event
      await tx.outboxEvent.create({
        data: createOutboxEvent({
          tenantId,
          eventType: FOUNDATION_EVENTS.ROLE_CREATED,
          aggregateId: role.id,
          actorUserId: authCtx.user.id,
          payload: {
            roleId: role.id,
            key: role.key,
            name: role.name,
            permissionIds: input.permissionIds || [],
          },
        }),
      });

      return role;
    });

    // Fetch role with permissions for response
    const role = await prisma.role.findUnique({
      where: { id: result.id },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    return c.json({
      id: role!.id,
      key: role!.key,
      name: role!.name,
      description: role!.description,
      isSystem: role!.isSystem,
      permissions: role!.rolePermissions.map((rp) => rp.permission),
    }, 201);
  }
);

/**
 * PUT /rbac/roles/:id/permissions
 * Update permissions for a role
 */
rbac.put(
  "/roles/:id/permissions",
  requirePermission(PERMISSIONS.USERS_MANAGE),
  zValidator("json", z.object({
    permissionIds: z.array(z.string().uuid()),
  })),
  async (c: Context) => {
    const authCtx = c.get("auth") as AuthContext;
    const tenantId = authCtx.tenantId!;
    const roleId = c.req.param("id");
    const input = c.req.valid("json") as { permissionIds: string[] };

    // Verify role exists and belongs to tenant (or is system role)
    const role = await prisma.role.findFirst({
      where: {
        id: roleId,
        OR: [
          { tenantId: null, isSystem: true }, // System roles
          { tenantId }, // Tenant-specific roles
        ],
      },
    });

    if (!role) {
      throw new HTTPException(404, { message: "Role not found" });
    }

    // Prevent modifying system roles (only tenant roles can be modified)
    if (role.isSystem && role.tenantId === null) {
      throw new HTTPException(403, { message: "Cannot modify system roles" });
    }

    // Verify role belongs to tenant
    if (role.tenantId !== tenantId) {
      throw new HTTPException(403, { message: "Access denied to this role" });
    }

    // Verify all permissions exist
    const permissions = await prisma.permission.findMany({
      where: { id: { in: input.permissionIds } },
    });

    if (permissions.length !== input.permissionIds.length) {
      throw new HTTPException(400, { message: "One or more invalid permission IDs" });
    }

    const previousPermissions = await prisma.rolePermission.findMany({
      where: { roleId },
      select: { permissionId: true },
    });

    const previousPermissionIds = previousPermissions.map((p) => p.permissionId);

    await prisma.$transaction(async (tx) => {
      // Remove existing permissions
      await tx.rolePermission.deleteMany({
        where: { roleId },
      });

      // Assign new permissions
      if (input.permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: input.permissionIds.map((permissionId) => ({
            roleId,
            permissionId,
          })),
        });
      }

      // Emit event
      await tx.outboxEvent.create({
        data: createOutboxEvent({
          tenantId,
          eventType: FOUNDATION_EVENTS.ROLE_PERMISSIONS_UPDATED,
          aggregateId: roleId,
          actorUserId: authCtx.user.id,
          payload: {
            roleId,
            previousPermissionIds,
            newPermissionIds: input.permissionIds,
          },
        }),
      });
    });

    // Fetch updated role with permissions
    const updatedRole = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    return c.json({
      id: updatedRole!.id,
      key: updatedRole!.key,
      name: updatedRole!.name,
      permissions: updatedRole!.rolePermissions.map((rp) => rp.permission),
    });
  }
);

/**
 * GET /rbac/my-permissions
 * Get current user's computed permissions for the active tenant
 */
rbac.get("/my-permissions", async (c: Context) => {
  const authCtx = c.get("auth") as AuthContext;

  return c.json({
    permissions: Array.from(authCtx.permissions),
    isPlatformAdmin: authCtx.user.isPlatformAdmin,
  });
});

export { rbac };

