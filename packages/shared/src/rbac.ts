import { z } from "zod";

// ============================================================================
// PERMISSIONS
// ============================================================================

export const PermissionCategories = [
  "ai",
  "users",
  "tenants",
  "projects",
  "tasks",
  "consents",
] as const;

export const PermissionCategoryEnum = z.enum(PermissionCategories);
export type PermissionCategory = z.infer<typeof PermissionCategoryEnum>;

export const PermissionSchema = z.object({
  id: z.string().uuid(),
  key: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  category: z.string().nullable(),
});

export type Permission = z.infer<typeof PermissionSchema>;

// Default permission keys
export const PERMISSIONS = {
  // AI Actions
  AI_ACTIONS_CREATE: "ai.actions.create",
  AI_ACTIONS_READ: "ai.actions.read",
  AI_ACTIONS_APPROVE: "ai.actions.approve",
  
  // Users
  USERS_READ: "users.read",
  USERS_INVITE: "users.invite",
  USERS_MANAGE: "users.manage",
  
  // Tenants
  TENANTS_SETTINGS: "tenants.settings",
  TENANTS_BILLING: "tenants.billing",
  
  // Projects
  PROJECTS_READ: "projects.read",
  PROJECTS_WRITE: "projects.write",
  PROJECTS_DELETE: "projects.delete",
  
  // Tasks
  TASKS_READ: "tasks.read",
  TASKS_WRITE: "tasks.write",
  TASKS_APPROVE: "tasks.approve",
  
  // Consents
  CONSENTS_READ: "consents.read",
  CONSENTS_WRITE: "consents.write",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// ============================================================================
// ROLES
// ============================================================================

export const RoleSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid().nullable(),
  key: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  isSystem: z.boolean(),
});

export type Role = z.infer<typeof RoleSchema>;

export const RoleWithPermissionsSchema = RoleSchema.extend({
  permissions: z.array(PermissionSchema),
});

export type RoleWithPermissions = z.infer<typeof RoleWithPermissionsSchema>;

// Default system roles
export const SYSTEM_ROLES = {
  OWNER: "owner",
  ADMIN: "admin",
  SALES: "sales",
  FIELD_TECH: "field_tech",
  CLIENT: "client",
} as const;

export type SystemRoleKey = (typeof SYSTEM_ROLES)[keyof typeof SYSTEM_ROLES];

// Role to permissions mapping (for seeding)
export const ROLE_PERMISSIONS: Record<SystemRoleKey, PermissionKey[]> = {
  owner: Object.values(PERMISSIONS),
  admin: [
    PERMISSIONS.AI_ACTIONS_CREATE,
    PERMISSIONS.AI_ACTIONS_READ,
    PERMISSIONS.AI_ACTIONS_APPROVE,
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_INVITE,
    PERMISSIONS.USERS_MANAGE,
    PERMISSIONS.TENANTS_SETTINGS,
    PERMISSIONS.PROJECTS_READ,
    PERMISSIONS.PROJECTS_WRITE,
    PERMISSIONS.PROJECTS_DELETE,
    PERMISSIONS.TASKS_READ,
    PERMISSIONS.TASKS_WRITE,
    PERMISSIONS.TASKS_APPROVE,
    PERMISSIONS.CONSENTS_READ,
    PERMISSIONS.CONSENTS_WRITE,
  ],
  sales: [
    PERMISSIONS.AI_ACTIONS_CREATE,
    PERMISSIONS.AI_ACTIONS_READ,
    PERMISSIONS.USERS_READ,
    PERMISSIONS.PROJECTS_READ,
    PERMISSIONS.PROJECTS_WRITE,
    PERMISSIONS.TASKS_READ,
    PERMISSIONS.TASKS_WRITE,
    PERMISSIONS.CONSENTS_READ,
  ],
  field_tech: [
    PERMISSIONS.AI_ACTIONS_CREATE,
    PERMISSIONS.AI_ACTIONS_READ,
    PERMISSIONS.PROJECTS_READ,
    PERMISSIONS.TASKS_READ,
    PERMISSIONS.TASKS_WRITE,
  ],
  client: [
    PERMISSIONS.PROJECTS_READ,
    PERMISSIONS.TASKS_READ,
  ],
};

// ============================================================================
// ROLE ASSIGNMENT
// ============================================================================

export const AssignRolesSchema = z.object({
  userId: z.string().uuid(),
  roleIds: z.array(z.string().uuid()),
});

export type AssignRolesInput = z.infer<typeof AssignRolesSchema>;

