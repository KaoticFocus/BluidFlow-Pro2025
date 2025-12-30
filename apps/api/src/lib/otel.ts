/**
 * OpenTelemetry Integration
 * Provides distributed tracing for the API
 */

import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { OTLPTraceExporter } from "@opentelemetry/exporter-otlp-http";
import { trace, context, SpanStatusCode, type Span } from "@opentelemetry/api";

let sdk: NodeSDK | null = null;

/**
 * Initialize OpenTelemetry SDK
 */
export function initializeOpenTelemetry() {
  if (sdk) {
    console.warn("OpenTelemetry already initialized");
    return;
  }

  // Only initialize in production or if explicitly enabled
  if (process.env.NODE_ENV !== "production" && process.env.ENABLE_OTEL !== "true") {
    console.log("OpenTelemetry disabled (set ENABLE_OTEL=true to enable)");
    return;
  }

  const serviceName = process.env.OTEL_SERVICE_NAME || "buildflow-api";
  const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://localhost:4318";

  sdk = new NodeSDK({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
      [SemanticResourceAttributes.SERVICE_VERSION]: "1.0.0",
    }),
    traceExporter: new OTLPTraceExporter({
      url: `${otlpEndpoint}/v1/traces`,
    }),
    instrumentations: [
      getNodeAutoInstrumentations({
        // Disable HTTP instrumentation (we'll add custom spans)
        "@opentelemetry/instrumentation-http": {
          enabled: false,
        },
      }),
    ],
  });

  sdk.start();
  console.log(`OpenTelemetry initialized (service: ${serviceName}, endpoint: ${otlpEndpoint})`);
}

/**
 * Shutdown OpenTelemetry SDK
 */
export async function shutdownOpenTelemetry() {
  if (sdk) {
    await sdk.shutdown();
    sdk = null;
    console.log("OpenTelemetry shutdown");
  }
}

/**
 * Get the tracer instance
 */
export function getTracer(name: string = "buildflow-api") {
  return trace.getTracer(name);
}

/**
 * Create a span for an operation
 */
export async function withSpan<T>(
  name: string,
  fn: (span: Span) => Promise<T>,
  attributes?: Record<string, string | number | boolean>
): Promise<T> {
  const tracer = getTracer();
  return await tracer.startActiveSpan(name, { attributes }, async (span) => {
    try {
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : String(error),
      });
      span.recordException(error instanceof Error ? error : new Error(String(error)));
      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * Add attributes to current span
 */
export function addSpanAttributes(attributes: Record<string, string | number | boolean>) {
  const span = trace.getActiveSpan();
  if (span) {
    span.setAttributes(attributes);
  }
}

/**
 * Get current trace ID
 */
export function getTraceId(): string | undefined {
  const span = trace.getActiveSpan();
  if (span) {
    const spanContext = span.spanContext();
    return spanContext.traceId;
  }
  return undefined;
}

/**
 * Get current span ID
 */
export function getSpanId(): string | undefined {
  const span = trace.getActiveSpan();
  if (span) {
    const spanContext = span.spanContext();
    return spanContext.spanId;
  }
  return undefined;
}

