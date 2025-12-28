/**
 * Database seed script
 * Seeds system roles and permissions for the RBAC foundation
 * 
 * Run with: npx prisma db seed
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Permission definitions
const PERMISSIONS = [
  // AI Actions
  { key: "ai.actions.create", name: "Create AI Actions", category: "ai", description: "Create new AI action requests" },
  { key: "ai.actions.read", name: "Read AI Actions", category: "ai", description: "View AI action logs and history" },
  { key: "ai.actions.approve", name: "Approve AI Actions", category: "ai", description: "Approve or reject AI actions" },
  
  // Users
  { key: "users.read", name: "Read Users", category: "users", description: "View team members" },
  { key: "users.invite", name: "Invite Users", category: "users", description: "Invite new team members" },
  { key: "users.manage", name: "Manage Users", category: "users", description: "Manage user roles and permissions" },
  
  // Tenants
  { key: "tenants.settings", name: "Tenant Settings", category: "tenants", description: "Manage tenant settings" },
  { key: "tenants.billing", name: "Tenant Billing", category: "tenants", description: "Manage billing and subscription" },
  
  // Projects
  { key: "projects.read", name: "Read Projects", category: "projects", description: "View projects" },
  { key: "projects.write", name: "Write Projects", category: "projects", description: "Create and edit projects" },
  { key: "projects.delete", name: "Delete Projects", category: "projects", description: "Delete projects" },
  
  // Tasks
  { key: "tasks.read", name: "Read Tasks", category: "tasks", description: "View tasks" },
  { key: "tasks.write", name: "Write Tasks", category: "tasks", description: "Create and edit tasks" },
  { key: "tasks.approve", name: "Approve Tasks", category: "tasks", description: "Approve task completions" },
  
  // Consents
  { key: "consents.read", name: "Read Consents", category: "consents", description: "View consent records" },
  { key: "consents.write", name: "Write Consents", category: "consents", description: "Capture and manage consents" },
];

// Role definitions with their permission keys
const ROLES = [
  {
    key: "owner",
    name: "Owner",
    description: "Full access to all features and settings",
    isSystem: true,
    permissions: PERMISSIONS.map((p) => p.key), // All permissions
  },
  {
    key: "admin",
    name: "Admin",
    description: "Administrative access without billing",
    isSystem: true,
    permissions: [
      "ai.actions.create", "ai.actions.read", "ai.actions.approve",
      "users.read", "users.invite", "users.manage",
      "tenants.settings",
      "projects.read", "projects.write", "projects.delete",
      "tasks.read", "tasks.write", "tasks.approve",
      "consents.read", "consents.write",
    ],
  },
  {
    key: "sales",
    name: "Sales",
    description: "Sales team access",
    isSystem: true,
    permissions: [
      "ai.actions.create", "ai.actions.read",
      "users.read",
      "projects.read", "projects.write",
      "tasks.read", "tasks.write",
      "consents.read",
    ],
  },
  {
    key: "field_tech",
    name: "Field Tech",
    description: "Field technician access",
    isSystem: true,
    permissions: [
      "ai.actions.create", "ai.actions.read",
      "projects.read",
      "tasks.read", "tasks.write",
    ],
  },
  {
    key: "client",
    name: "Client",
    description: "Customer/client portal access",
    isSystem: true,
    permissions: [
      "projects.read",
      "tasks.read",
    ],
  },
];

async function main() {
  console.log("🌱 Seeding database...\n");

  // Create permissions
  console.log("Creating permissions...");
  const createdPermissions: Record<string, { id: string }> = {};
  
  for (const permission of PERMISSIONS) {
    const created = await prisma.permission.upsert({
      where: { key: permission.key },
      update: {
        name: permission.name,
        description: permission.description,
        category: permission.category,
      },
      create: permission,
    });
    createdPermissions[permission.key] = created;
    console.log(`  ✓ ${permission.key}`);
  }

  // Create system roles
  console.log("\nCreating system roles...");
  
  for (const roleData of ROLES) {
    const { permissions: permissionKeys, ...roleFields } = roleData;
    
    // Create or update role
    const role = await prisma.role.upsert({
      where: {
        tenantId_key: {
          tenantId: null as unknown as string, // System roles have null tenantId
          key: roleData.key,
        },
      },
      update: {
        name: roleFields.name,
        description: roleFields.description,
      },
      create: {
        ...roleFields,
        tenantId: null,
      },
    });

    // Delete existing role permissions and recreate
    await prisma.rolePermission.deleteMany({
      where: { roleId: role.id },
    });

    // Assign permissions to role
    const rolePermissions = permissionKeys.map((permKey) => ({
      roleId: role.id,
      permissionId: createdPermissions[permKey].id,
    }));

    await prisma.rolePermission.createMany({
      data: rolePermissions,
    });

    console.log(`  ✓ ${roleData.name} (${permissionKeys.length} permissions)`);
  }

  console.log("\n✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

