import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { HTTPException } from "hono/http-exception";
import { InviteSchema, AcceptInviteSchema } from "@buildflow/shared";
import { PERMISSIONS } from "@buildflow/shared";
import { authMiddleware, tenantMiddleware, requirePermission } from "../middleware/auth";
import { generateInviteToken } from "../lib/password";
import { createOutboxEvent, FOUNDATION_EVENTS } from "../lib/outbox";

const tenants = new Hono();

// All routes require authentication
tenants.use("*", authMiddleware);

/**
 * GET /tenants/members
 * List members of current tenant
 */
tenants.get(
  "/members",
  tenantMiddleware,
  requirePermission(PERMISSIONS.USERS_READ),
  async (c) => {
    const authCtx = c.get("auth");
    const tenantId = authCtx.tenantId!;

    // TODO: Replace with Prisma implementation
    /*
    const memberships = await prisma.tenantMembership.findMany({
      where: { tenantId, status: { not: "disabled" } },
      include: {
        user: { select: { id: true, email: true, name: true, avatarUrl: true } },
        roles: { include: { role: { select: { id: true, key: true, name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    const members = memberships.map((m) => ({
      id: m.id,
      userId: m.user.id,
      userEmail: m.user.email,
      userName: m.user.name,
      userAvatarUrl: m.user.avatarUrl,
      status: m.status,
      roles: m.roles.map((r) => r.role),
      createdAt: m.createdAt,
    }));
    */

    return c.json({ members: [] });
  }
);

/**
 * POST /tenants/invite
 * Invite a new member to the tenant
 */
tenants.post(
  "/invite",
  tenantMiddleware,
  requirePermission(PERMISSIONS.USERS_INVITE),
  zValidator("json", InviteSchema),
  async (c) => {
    const authCtx = c.get("auth");
    const tenantId = authCtx.tenantId!;
    const input = c.req.valid("json");

    // TODO: Replace with Prisma implementation
    /*
    // Check if user is already a member
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      const existingMembership = await prisma.tenantMembership.findUnique({
        where: {
          tenantId_userId: {
            tenantId,
            userId: existingUser.id,
          },
        },
      });

      if (existingMembership) {
        throw new HTTPException(409, { message: "User is already a member of this tenant" });
      }
    }

    // Check if there's a pending invitation
    const existingInvite = await prisma.tenantInvitation.findFirst({
      where: {
        tenantId,
        email: input.email,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvite) {
      throw new HTTPException(409, { message: "An invitation is already pending for this email" });
    }

    const token = generateInviteToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await prisma.$transaction(async (tx) => {
      const invite = await tx.tenantInvitation.create({
        data: {
          tenantId,
          email: input.email,
          token,
          roleIds: input.roleIds,
          invitedById: authCtx.user.id,
          expiresAt,
        },
      });

      await tx.outboxEvent.create({
        data: createOutboxEvent({
          tenantId,
          eventType: FOUNDATION_EVENTS.MEMBER_INVITED,
          aggregateId: invite.id,
          actorUserId: authCtx.user.id,
          payload: {
            invitationId: invite.id,
            email: input.email,
            roleIds: input.roleIds,
            invitedById: authCtx.user.id,
            expiresAt: expiresAt.toISOString(),
          },
        }),
      });

      return invite;
    });

    // TODO: Queue email job to send invitation
    */

    const token = generateInviteToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    return c.json({
      inviteId: "placeholder-invite-id",
      email: input.email,
      expiresAt: expiresAt.toISOString(),
    }, 201);
  }
);

/**
 * POST /tenants/accept-invite
 * Accept an invitation (public endpoint, no auth required initially)
 */
const publicTenants = new Hono();

publicTenants.post(
  "/accept-invite",
  zValidator("json", AcceptInviteSchema),
  async (c) => {
    const input = c.req.valid("json");

    // TODO: Replace with Prisma implementation
    /*
    const invitation = await prisma.tenantInvitation.findUnique({
      where: { token: input.token },
      include: { tenant: true },
    });

    if (!invitation) {
      throw new HTTPException(404, { message: "Invalid invitation token" });
    }

    if (invitation.acceptedAt) {
      throw new HTTPException(400, { message: "Invitation has already been accepted" });
    }

    if (invitation.expiresAt < new Date()) {
      throw new HTTPException(400, { message: "Invitation has expired" });
    }

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email: invitation.email },
    });

    const result = await prisma.$transaction(async (tx) => {
      // Create user if doesn't exist
      if (!user) {
        if (!input.password) {
          throw new HTTPException(400, { message: "Password is required for new users" });
        }
        user = await tx.user.create({
          data: {
            email: invitation.email,
            passwordHash: hashPassword(input.password),
            name: input.name,
            status: "active",
          },
        });
      }

      // Create membership
      const membership = await tx.tenantMembership.create({
        data: {
          tenantId: invitation.tenantId,
          userId: user.id,
          status: "active",
        },
      });

      // Assign roles
      await tx.membershipRole.createMany({
        data: invitation.roleIds.map((roleId) => ({
          membershipId: membership.id,
          roleId,
        })),
      });

      // Mark invitation as accepted
      await tx.tenantInvitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      });

      // Emit event
      await tx.outboxEvent.create({
        data: createOutboxEvent({
          tenantId: invitation.tenantId,
          eventType: FOUNDATION_EVENTS.MEMBER_JOINED,
          aggregateId: membership.id,
          payload: {
            membershipId: membership.id,
            userId: user.id,
            roleIds: invitation.roleIds,
          },
        }),
      });

      return { membership, user };
    });
    */

    return c.json({
      membership: {
        id: "placeholder-membership-id",
        tenantId: "placeholder-tenant-id",
        userId: "placeholder-user-id",
        status: "active",
      },
    });
  }
);

/**
 * GET /tenants/invitations
 * List pending invitations for current tenant
 */
tenants.get(
  "/invitations",
  tenantMiddleware,
  requirePermission(PERMISSIONS.USERS_INVITE),
  async (c) => {
    const authCtx = c.get("auth");
    const tenantId = authCtx.tenantId!;

    // TODO: Replace with Prisma implementation
    /*
    const invitations = await prisma.tenantInvitation.findMany({
      where: {
        tenantId,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        invitedBy: { select: { id: true, email: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    */

    return c.json({ invitations: [] });
  }
);

/**
 * DELETE /tenants/invitations/:id
 * Cancel a pending invitation
 */
tenants.delete(
  "/invitations/:id",
  tenantMiddleware,
  requirePermission(PERMISSIONS.USERS_INVITE),
  async (c) => {
    const authCtx = c.get("auth");
    const tenantId = authCtx.tenantId!;
    const invitationId = c.req.param("id");

    // TODO: Replace with Prisma implementation
    /*
    const invitation = await prisma.tenantInvitation.findFirst({
      where: { id: invitationId, tenantId },
    });

    if (!invitation) {
      throw new HTTPException(404, { message: "Invitation not found" });
    }

    await prisma.tenantInvitation.delete({
      where: { id: invitationId },
    });
    */

    return c.body(null, 204);
  }
);

export { tenants, publicTenants };

