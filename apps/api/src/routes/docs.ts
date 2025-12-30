/**
 * API Documentation Routes
 * Serves OpenAPI specification and Swagger UI
 */

import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import { getOpenApiSpec } from "../lib/openapi";

const docs = new OpenAPIHono();

// Swagger UI endpoint
docs.get(
  "/ui",
  swaggerUI({
    url: "/docs/spec",
  })
);

// OpenAPI JSON spec endpoint
docs.get("/spec", (c) => {
  return c.json(getOpenApiSpec());
});

export { docs };

