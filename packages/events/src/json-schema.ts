/**
 * JSON Schema Export
 * Converts Zod schemas to JSON Schema format for cross-service validation
 */

import type { ZodSchema } from "zod";
import { getRegistry } from "./registry";

/**
 * Convert a Zod schema to JSON Schema (simplified implementation)
 * For production, use zod-to-json-schema library
 */
export function zodToJsonSchema(schema: ZodSchema): Record<string, unknown> {
  // This is a simplified implementation
  // For production, install and use: zod-to-json-schema
  // import { zodToJsonSchema } from "zod-to-json-schema";
  
  // Basic structure - in production, use proper conversion library
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    properties: {},
    required: [],
    // Note: Full conversion requires zod-to-json-schema library
  };
}

/**
 * Get JSON Schema for a registered schema
 */
export function getJsonSchema(schemaId: string, version: string): Record<string, unknown> | null {
  const registry = getRegistry();
  const metadata = registry.get(schemaId, version);

  if (!metadata) {
    return null;
  }

  return zodToJsonSchema(metadata.schema);
}

/**
 * Get all JSON Schemas
 */
export function getAllJsonSchemas(): Array<{
  schemaId: string;
  version: string;
  jsonSchema: Record<string, unknown>;
  deprecated?: boolean;
  description?: string;
}> {
  const registry = getRegistry();
  return registry.list().map((metadata) => ({
    schemaId: metadata.schemaId,
    version: metadata.version,
    jsonSchema: zodToJsonSchema(metadata.schema),
    deprecated: metadata.deprecated,
    description: metadata.description,
  }));
}

