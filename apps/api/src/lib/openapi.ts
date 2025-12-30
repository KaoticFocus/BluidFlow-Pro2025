/**
 * OpenAPI Documentation Generator
 * Generates OpenAPI 3.0 specification from route definitions
 */

import type { OpenAPIV3 } from "openapi-types";

export const openApiSpec: OpenAPIV3.Document = {
  openapi: "3.0.0",
  info: {
    title: "BuildFlow Pro API",
    version: "1.0.0",
    description: "AI-powered construction management platform API",
    contact: {
      name: "BuildFlow Support",
    },
  },
  servers: [
    {
      url: "http://localhost:3001",
      description: "Development server",
    },
    {
      url: "https://api.buildflow.pro",
      description: "Production server",
    },
  ],
  tags: [
    {
      name: "Auth",
      description: "Authentication and session management",
    },
    {
      name: "Tenants",
      description: "Tenant management and member operations",
    },
    {
      name: "RBAC",
      description: "Role-Based Access Control",
    },
    {
      name: "TaskFlow",
      description: "Task management and daily planning",
    },
    {
      name: "AI Actions",
      description: "AI action logging and decision-making",
    },
    {
      name: "Consents",
      description: "Consent management for data processing",
    },
    {
      name: "Meetings",
      description: "Meeting management and transcripts",
    },
    {
      name: "Internal",
      description: "Internal service endpoints",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "JWT token from /auth/signin or /auth/signup",
      },
      serviceAuth: {
        type: "apiKey",
        in: "header",
        name: "X-Service-Token",
        description: "Service-to-service authentication",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          error: {
            type: "object",
            properties: {
              message: {
                type: "string",
                description: "Error message",
              },
              status: {
                type: "number",
                description: "HTTP status code",
              },
            },
            required: ["message", "status"],
          },
        },
        required: ["error"],
      },
      PaginationMeta: {
        type: "object",
        properties: {
          page: {
            type: "number",
            description: "Current page number",
          },
          pageSize: {
            type: "number",
            description: "Number of items per page",
          },
          total: {
            type: "number",
            description: "Total number of items",
          },
          totalPages: {
            type: "number",
            description: "Total number of pages",
          },
        },
        required: ["page", "pageSize", "total", "totalPages"],
      },
      Task: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          tenantId: { type: "string", format: "uuid" },
          title: { type: "string" },
          description: { type: "string", nullable: true },
          status: {
            type: "string",
            enum: ["open", "in_progress", "completed", "cancelled"],
          },
          priority: {
            type: "string",
            enum: ["low", "medium", "high", "urgent"],
            nullable: true,
          },
          dueDate: { type: "string", format: "date-time", nullable: true },
          assignedToId: { type: "string", format: "uuid", nullable: true },
          projectId: { type: "string", format: "uuid", nullable: true },
          parentTaskId: { type: "string", format: "uuid", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: ["id", "tenantId", "title", "status", "createdAt", "updatedAt"],
      },
      DailyPlan: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          tenantId: { type: "string", format: "uuid" },
          date: { type: "string", format: "date" },
          status: {
            type: "string",
            enum: ["draft", "approved", "published"],
          },
          tasks: {
            type: "array",
            items: { $ref: "#/components/schemas/Task" },
          },
          metrics: {
            type: "object",
            properties: {
              totalTasks: { type: "number" },
              completedTasks: { type: "number" },
              inProgressTasks: { type: "number" },
              openTasks: { type: "number" },
            },
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: ["id", "tenantId", "date", "status", "createdAt", "updatedAt"],
      },
      AIActionLog: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          tenantId: { type: "string", format: "uuid" },
          subjectType: { type: "string" },
          subjectId: { type: "string", format: "uuid" },
          purposeKey: { type: "string" },
          status: {
            type: "string",
            enum: ["pending", "approved", "rejected"],
          },
          createdAt: { type: "string", format: "date-time" },
        },
        required: ["id", "tenantId", "subjectType", "subjectId", "purposeKey", "status", "createdAt"],
      },
      Consent: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          tenantId: { type: "string", format: "uuid" },
          subjectType: { type: "string" },
          subjectId: { type: "string", format: "uuid" },
          purposeKey: { type: "string" },
          active: { type: "boolean" },
          grantedAt: { type: "string", format: "date-time", nullable: true },
          revokedAt: { type: "string", format: "date-time", nullable: true },
        },
        required: ["id", "tenantId", "subjectType", "subjectId", "purposeKey", "active"],
      },
    },
  },
  paths: {},
};

/**
 * Add a path to the OpenAPI spec
 */
export function addPath(
  method: string,
  path: string,
  spec: OpenAPIV3.OperationObject
) {
  if (!openApiSpec.paths[path]) {
    openApiSpec.paths[path] = {};
  }
  openApiSpec.paths[path][method.toLowerCase()] = spec;
}

/**
 * Get the OpenAPI spec as JSON
 */
export function getOpenApiSpec(): OpenAPIV3.Document {
  return openApiSpec;
}

