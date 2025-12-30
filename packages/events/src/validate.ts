/**
 * Event Validation
 * Validates event payloads against registered schemas
 */

import { z } from "zod";
import { getRegistry } from "./registry";

export interface ValidationResult {
  valid: boolean;
  errors?: z.ZodError;
  warnings?: string[];
  schemaId?: string;
  version?: string;
}

/**
 * Validate an event payload against a schema
 */
export function validateEvent(
  schemaId: string,
  version: string,
  payload: unknown
): ValidationResult {
  const registry = getRegistry();
  const metadata = registry.find(schemaId, version);

  if (!metadata) {
    return {
      valid: false,
      errors: new z.ZodError([
        {
          code: "custom",
          path: [],
          message: `Schema not found: ${schemaId}@${version}`,
        },
      ]),
      warnings: [`Schema ${schemaId}@${version} not registered`],
    };
  }

  // Check deprecation
  const warnings: string[] = [];
  if (metadata.deprecated) {
    warnings.push(
      `Schema ${schemaId}@${version} is deprecated${metadata.deprecatedSince ? ` since ${metadata.deprecatedSince}` : ""}`
    );
  }

  // Validate payload
  const result = metadata.schema.safeParse(payload);

  if (result.success) {
    return {
      valid: true,
      warnings: warnings.length > 0 ? warnings : undefined,
      schemaId: metadata.schemaId,
      version: metadata.version,
    };
  } else {
    return {
      valid: false,
      errors: result.error,
      warnings: warnings.length > 0 ? warnings : undefined,
      schemaId: metadata.schemaId,
      version: metadata.version,
    };
  }
}

/**
 * Validate event type string and extract schema info
 * e.g., "user.created.v1" -> { schemaId: "foundation.user.created", version: "v1" }
 */
export function parseEventType(eventType: string): {
  schemaId: string;
  version: string;
} {
  const parts = eventType.split(".");
  if (parts.length < 2) {
    throw new Error(`Invalid event type format: ${eventType}`);
  }

  const version = parts[parts.length - 1]; // Last part is version
  const eventName = parts.slice(0, -1).join("."); // Everything except last part

  // Determine schema prefix based on event name
  let prefix = "foundation";
  if (eventName.startsWith("task.") || eventName.startsWith("daily_plan.")) {
    prefix = "taskflow";
  } else if (eventName.startsWith("meeting.")) {
    prefix = "meetingflow";
  }

  const schemaId = `${prefix}.${eventName}`;

  return { schemaId, version };
}

/**
 * Validate event with automatic schema detection from event type
 */
export function validateEventByType(
  eventType: string,
  payload: unknown
): ValidationResult {
  try {
    const { schemaId, version } = parseEventType(eventType);
    return validateEvent(schemaId, version, payload);
  } catch (error) {
    return {
      valid: false,
      errors: new z.ZodError([
        {
          code: "custom",
          path: [],
          message: error instanceof Error ? error.message : String(error),
        },
      ]),
    };
  }
}

