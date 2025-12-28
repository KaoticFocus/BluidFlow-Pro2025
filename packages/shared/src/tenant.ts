import { z } from "zod";

// ============================================================================
// TENANT
// ============================================================================

export const TenantPlanEnum = z.enum(["free", "starter", "pro", "enterprise"]);
export type TenantPlan = z.infer<typeof TenantPlanEnum>;

export const TenantSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  plan: TenantPlanEnum,
  ownerUserId: z.string().uuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Tenant = z.infer<typeof TenantSchema>;

export const CreateTenantSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z
    .string()
    .min(3)
    .max(63)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens")
    .optional(),
});

export type CreateTenantInput = z.infer<typeof CreateTenantSchema>;

// ============================================================================
// MEMBERSHIP
// ============================================================================

export const MembershipStatusEnum = z.enum(["active", "invited", "disabled"]);
export type MembershipStatus = z.infer<typeof MembershipStatusEnum>;

export const TenantMembershipSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  userId: z.string().uuid(),
  status: MembershipStatusEnum,
  createdAt: z.coerce.date(),
});

export type TenantMembership = z.infer<typeof TenantMembershipSchema>;

export const MemberWithRolesSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  userName: z.string().nullable(),
  userEmail: z.string().email(),
  status: MembershipStatusEnum,
  roles: z.array(z.object({ id: z.string().uuid(), key: z.string(), name: z.string() })),
  createdAt: z.coerce.date(),
});

export type MemberWithRoles = z.infer<typeof MemberWithRolesSchema>;

// ============================================================================
// INVITATIONS
// ============================================================================

export const InviteSchema = z.object({
  email: z.string().email(),
  roleIds: z.array(z.string().uuid()).min(1, "At least one role is required"),
});

export type InviteInput = z.infer<typeof InviteSchema>;

export const AcceptInviteSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128).optional(),
  name: z.string().min(1).max(255).optional(),
});

export type AcceptInviteInput = z.infer<typeof AcceptInviteSchema>;

export const InvitationSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  email: z.string().email(),
  roleIds: z.array(z.string().uuid()),
  invitedById: z.string().uuid(),
  expiresAt: z.coerce.date(),
  acceptedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
});

export type Invitation = z.infer<typeof InvitationSchema>;

