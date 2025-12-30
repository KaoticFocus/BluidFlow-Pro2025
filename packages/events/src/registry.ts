/**
 * Schema Registry
 * Maps schema_id@version to Zod schemas and metadata
 */

import { z } from "zod";
import type { ZodSchema } from "zod";
import {
  UserCreatedEventSchema,
  UserSignedInEventSchema,
  UserSignedOutEventSchema,
  TenantCreatedEventSchema,
  MemberInvitedEventSchema,
  MemberJoinedEventSchema,
  MemberRolesChangedEventSchema,
  ConsentCapturedEventSchema,
  ConsentRevokedEventSchema,
  AIActionLoggedEventSchema,
  AIActionApprovedEventSchema,
  AIActionRejectedEventSchema,
  AIActionExecutedEventSchema,
} from "./foundation";
import {
  TaskCreatedEventSchema,
  TaskUpdatedEventSchema,
  TaskApprovedEventSchema,
  TaskCompletedEventSchema,
  ChecklistItemCreatedEventSchema,
  ChecklistItemUpdatedEventSchema,
  DailyPlanGeneratedEventSchema,
  DailyPlanApprovedEventSchema,
} from "./taskflow";

export interface SchemaMetadata {
  schemaId: string;
  version: string;
  schema: ZodSchema;
  deprecated?: boolean;
  deprecatedSince?: string;
  description?: string;
}

type SchemaRegistryMap = Map<string, SchemaMetadata>;

class SchemaRegistry {
  private schemas: SchemaRegistryMap = new Map();

  /**
   * Register a schema
   */
  register(metadata: SchemaMetadata): void {
    const key = `${metadata.schemaId}@${metadata.version}`;
    this.schemas.set(key, metadata);
  }

  /**
   * Get schema by schemaId and version
   */
  get(schemaId: string, version: string): SchemaMetadata | undefined {
    const key = `${schemaId}@${version}`;
    return this.schemas.get(key);
  }

  /**
   * Find schema with wildcard support
   * e.g., "foundation.user.*@v1" matches "foundation.user.created@v1"
   */
  find(schemaIdPattern: string, version: string): SchemaMetadata | undefined {
    // Exact match first
    const exact = this.get(schemaIdPattern, version);
    if (exact) {
      return exact;
    }

    // Wildcard match
    if (schemaIdPattern.includes("*")) {
      const pattern = schemaIdPattern.replace(/\*/g, ".*");
      const regex = new RegExp(`^${pattern}$`);

      for (const [key, metadata] of this.schemas.entries()) {
        if (key.endsWith(`@${version}`) && regex.test(metadata.schemaId)) {
          return metadata;
        }
      }
    }

    return undefined;
  }

  /**
   * List all registered schemas
   */
  list(): SchemaMetadata[] {
    return Array.from(this.schemas.values());
  }

  /**
   * List schemas by prefix
   */
  listByPrefix(prefix: string): SchemaMetadata[] {
    return Array.from(this.schemas.values()).filter((metadata) =>
      metadata.schemaId.startsWith(prefix)
    );
  }

  /**
   * Check if schema is deprecated
   */
  isDeprecated(schemaId: string, version: string): boolean {
    const metadata = this.get(schemaId, version);
    return metadata?.deprecated === true;
  }
}

// Create singleton instance
const registry = new SchemaRegistry();

/**
 * Initialize registry with all event schemas
 */
export function initializeRegistry(): void {
  // Foundation events
  registry.register({
    schemaId: "foundation.user.created",
    version: "v1",
    schema: UserCreatedEventSchema,
    description: "User account created",
  });

  registry.register({
    schemaId: "foundation.user.signed_in",
    version: "v1",
    schema: UserSignedInEventSchema,
    description: "User signed in",
  });

  registry.register({
    schemaId: "foundation.user.signed_out",
    version: "v1",
    schema: UserSignedOutEventSchema,
    description: "User signed out",
  });

  registry.register({
    schemaId: "foundation.tenant.created",
    version: "v1",
    schema: TenantCreatedEventSchema,
    description: "Tenant/organization created",
  });

  registry.register({
    schemaId: "foundation.tenant.member.invited",
    version: "v1",
    schema: MemberInvitedEventSchema,
    description: "Tenant member invited",
  });

  registry.register({
    schemaId: "foundation.tenant.member.joined",
    version: "v1",
    schema: MemberJoinedEventSchema,
    description: "Tenant member joined",
  });

  registry.register({
    schemaId: "foundation.tenant.member.roles_changed",
    version: "v1",
    schema: MemberRolesChangedEventSchema,
    description: "Tenant member roles changed",
  });

  registry.register({
    schemaId: "foundation.consent.captured",
    version: "v1",
    schema: ConsentCapturedEventSchema,
    description: "Consent captured",
  });

  registry.register({
    schemaId: "foundation.consent.revoked",
    version: "v1",
    schema: ConsentRevokedEventSchema,
    description: "Consent revoked",
  });

  registry.register({
    schemaId: "foundation.ai.action.logged",
    version: "v1",
    schema: AIActionLoggedEventSchema,
    description: "AI action logged",
  });

  registry.register({
    schemaId: "foundation.ai.action.approved",
    version: "v1",
    schema: AIActionApprovedEventSchema,
    description: "AI action approved",
  });

  registry.register({
    schemaId: "foundation.ai.action.rejected",
    version: "v1",
    schema: AIActionRejectedEventSchema,
    description: "AI action rejected",
  });

  registry.register({
    schemaId: "foundation.ai.action.executed",
    version: "v1",
    schema: AIActionExecutedEventSchema,
    description: "AI action executed",
  });

  // TaskFlow events
  registry.register({
    schemaId: "taskflow.task.created",
    version: "v1",
    schema: TaskCreatedEventSchema,
    description: "Task created",
  });

  registry.register({
    schemaId: "taskflow.task.updated",
    version: "v1",
    schema: TaskUpdatedEventSchema,
    description: "Task updated",
  });

  registry.register({
    schemaId: "taskflow.task.approved",
    version: "v1",
    schema: TaskApprovedEventSchema,
    description: "Task approved",
  });

  registry.register({
    schemaId: "taskflow.task.completed",
    version: "v1",
    schema: TaskCompletedEventSchema,
    description: "Task completed",
  });

  registry.register({
    schemaId: "taskflow.task.checklist_item.created",
    version: "v1",
    schema: ChecklistItemCreatedEventSchema,
    description: "Checklist item created",
  });

  registry.register({
    schemaId: "taskflow.task.checklist_item.updated",
    version: "v1",
    schema: ChecklistItemUpdatedEventSchema,
    description: "Checklist item updated",
  });

  registry.register({
    schemaId: "taskflow.daily_plan.generated",
    version: "v1",
    schema: DailyPlanGeneratedEventSchema,
    description: "Daily plan generated",
  });

  registry.register({
    schemaId: "taskflow.daily_plan.approved",
    version: "v1",
    schema: DailyPlanApprovedEventSchema,
    description: "Daily plan approved",
  });

  // MeetingFlow events (will be added when meetingflow.ts schemas are registered)
}

/**
 * Get the schema registry instance
 */
export function getRegistry(): SchemaRegistry {
  return registry;
}

// Initialize on module load
initializeRegistry();

