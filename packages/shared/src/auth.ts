import { z } from "zod";

// ============================================================================
// USER
// ============================================================================

export const UserStatusEnum = z.enum(["active", "disabled", "pending"]);
export type UserStatus = z.infer<typeof UserStatusEnum>;

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  emailVerified: z.boolean(),
  name: z.string().nullable(),
  avatarUrl: z.string().url().nullable(),
  isPlatformAdmin: z.boolean(),
  status: UserStatusEnum,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type User = z.infer<typeof UserSchema>;

export const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(255).optional(),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;

// ============================================================================
// SESSION
// ============================================================================

export const SessionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  activeTenantId: z.string().uuid().nullable(),
  token: z.string(),
  expiresAt: z.coerce.date(),
  createdAt: z.coerce.date(),
});

export type Session = z.infer<typeof SessionSchema>;

export const SessionInfoSchema = z.object({
  user: UserSchema.omit({ updatedAt: true }),
  activeTenant: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
      slug: z.string(),
    })
    .nullable(),
  memberships: z.array(
    z.object({
      tenantId: z.string().uuid(),
      tenantName: z.string(),
      tenantSlug: z.string(),
      roles: z.array(z.string()),
    })
  ),
});

export type SessionInfo = z.infer<typeof SessionInfoSchema>;

// ============================================================================
// AUTH REQUESTS
// ============================================================================

export const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(255).optional(),
  tenantName: z.string().min(1).max(255),
});

export type SignupInput = z.infer<typeof SignupSchema>;

export const SigninSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type SigninInput = z.infer<typeof SigninSchema>;

export const SwitchTenantSchema = z.object({
  tenantId: z.string().uuid(),
});

export type SwitchTenantInput = z.infer<typeof SwitchTenantSchema>;

