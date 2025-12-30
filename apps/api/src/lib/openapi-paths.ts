/**
 * OpenAPI Path Definitions
 * Defines API endpoints for OpenAPI documentation
 */

import { addPath, openApiSpec } from "./openapi";

/**
 * Register all API paths for OpenAPI documentation
 * This should be called after all routes are defined
 */
export function registerOpenApiPaths() {
  // TaskFlow endpoints
  addPath("get", "/v1/taskflow/tasks", {
    tags: ["TaskFlow"],
    summary: "List tasks",
    description: "Get a paginated list of tasks for the current tenant",
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: "page",
        in: "query",
        schema: { type: "integer", default: 1 },
        description: "Page number",
      },
      {
        name: "pageSize",
        in: "query",
        schema: { type: "integer", default: 20, maximum: 100 },
        description: "Items per page",
      },
      {
        name: "status",
        in: "query",
        schema: { type: "string", enum: ["open", "in_progress", "completed", "cancelled"] },
        description: "Filter by status",
      },
      {
        name: "projectId",
        in: "query",
        schema: { type: "string", format: "uuid" },
        description: "Filter by project",
      },
    ],
    responses: {
      "200": {
        description: "List of tasks",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                data: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Task" },
                },
                meta: { $ref: "#/components/schemas/PaginationMeta" },
              },
            },
          },
        },
      },
      "401": { $ref: "#/components/responses/Unauthorized" },
      "403": { $ref: "#/components/responses/Forbidden" },
    },
  });

  addPath("post", "/v1/taskflow/tasks", {
    tags: ["TaskFlow"],
    summary: "Create task",
    description: "Create a new task",
    security: [{ bearerAuth: [] }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["title"],
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              status: { type: "string", enum: ["open", "in_progress"], default: "open" },
              priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
              dueDate: { type: "string", format: "date-time" },
              assignedToId: { type: "string", format: "uuid" },
              projectId: { type: "string", format: "uuid" },
              parentTaskId: { type: "string", format: "uuid" },
            },
          },
        },
      },
    },
    responses: {
      "201": {
        description: "Task created",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Task" },
          },
        },
      },
      "400": { $ref: "#/components/responses/BadRequest" },
      "401": { $ref: "#/components/responses/Unauthorized" },
      "403": { $ref: "#/components/responses/Forbidden" },
    },
  });

  addPath("get", "/v1/taskflow/tasks/{id}", {
    tags: ["TaskFlow"],
    summary: "Get task",
    description: "Get a single task by ID",
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
    ],
    responses: {
      "200": {
        description: "Task details",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Task" },
          },
        },
      },
      "404": { $ref: "#/components/responses/NotFound" },
      "401": { $ref: "#/components/responses/Unauthorized" },
    },
  });

  addPath("patch", "/v1/taskflow/tasks/{id}", {
    tags: ["TaskFlow"],
    summary: "Update task",
    description: "Update an existing task",
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
    ],
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              status: { type: "string", enum: ["open", "in_progress", "completed", "cancelled"] },
              priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
              dueDate: { type: "string", format: "date-time" },
              assignedToId: { type: "string", format: "uuid" },
            },
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Task updated",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Task" },
          },
        },
      },
      "404": { $ref: "#/components/responses/NotFound" },
      "401": { $ref: "#/components/responses/Unauthorized" },
      "403": { $ref: "#/components/responses/Forbidden" },
    },
  });

  addPath("post", "/v1/taskflow/daily-plans/generate", {
    tags: ["TaskFlow"],
    summary: "Generate daily plan",
    description: "Generate a daily plan for a specific date",
    security: [{ bearerAuth: [] }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["date"],
            properties: {
              date: { type: "string", format: "date", description: "YYYY-MM-DD format" },
              projectId: { type: "string", format: "uuid" },
            },
          },
        },
      },
    },
    responses: {
      "201": {
        description: "Daily plan generated",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/DailyPlan" },
          },
        },
      },
      "400": { $ref: "#/components/responses/BadRequest" },
      "401": { $ref: "#/components/responses/Unauthorized" },
    },
  });

  addPath("post", "/v1/taskflow/daily-plans/{id}/approve", {
    tags: ["TaskFlow"],
    summary: "Approve daily plan",
    description: "Approve a daily plan",
    security: [{ bearerAuth: [] }],
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
    ],
    responses: {
      "200": {
        description: "Daily plan approved",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/DailyPlan" },
          },
        },
      },
      "404": { $ref: "#/components/responses/NotFound" },
      "401": { $ref: "#/components/responses/Unauthorized" },
      "403": { $ref: "#/components/responses/Forbidden" },
    },
  });

  // Add common response schemas
  if (!openApiSpec.components?.responses) {
    openApiSpec.components = openApiSpec.components || {};
    openApiSpec.components.responses = {};
  }

  openApiSpec.components.responses.Unauthorized = {
    description: "Unauthorized",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/Error" },
      },
    },
  };

  openApiSpec.components.responses.Forbidden = {
    description: "Forbidden",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/Error" },
      },
    },
  };

  openApiSpec.components.responses.BadRequest = {
    description: "Bad Request",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/Error" },
      },
    },
  };

  openApiSpec.components.responses.NotFound = {
    description: "Not Found",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/Error" },
      },
    },
  };
}

