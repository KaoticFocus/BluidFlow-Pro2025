Feature Overview
Shared, tenant-aware event foundation providing a canonical event model with versioned schemas, transactional outbox, immutable append-only event log, and idempotent consumer guarantees. Enables all modules to publish/consume events reliably across web, mobile, and backend services with auditability, RBAC, and traceability.

Requirements
- Canonical Event Model
  - Event naming: <domain>.<entity>.<action>@v<semver-major> (e.g., customer.profile.updated@v1).
  - Required headers: event_id (UUIDv7), occurred_at (ISO-8601), produced_at, tenant_id, actor {type, id}, schema_id, schema_version, correlation_id, causation_id, source_service, dedupe_key, checksum, pii_tags[].
  - Payload: JSON validated by Zod schema; export JSON Schema for cross-service validation.
  - Versioning rules: vN is immutable; only backward-compatible additive changes within a major; deprecate vN-1 with minimum 90-day overlap.

- Outbox Pattern (transactional write)
  - Library function to enqueue events in same DB transaction as domain mutations.
  - Relay moves rows from outbox to event_log with at-least-once delivery and idempotent publish (unique on event_id).
  - Retries with exponential backoff; max_attempts default=10; moves to DLQ on exhaustion.
  - Outbox visibility timeout to prevent stuck rows; not_before for delayed publish.

- Event Log (immutable append-only)
  - Monotonic sequence (bigint), event_id (UUID), tenant_id, schema_id@version, headers JSONB, payload JSONB (redacted), payload_hash, published_at.
  - Constraints: no UPDATE/DELETE; only INSERT; unique(event_id); index on (tenant_id, sequence), (schema_id, sequence), (correlation_id).
  - Redaction: store redacted payload for audit; sensitive blobs must be referenced or encrypted separately.
  - Retention: default indefinite; support logical compaction for derived stores, never mutate event_log.

- Idempotent Consumers
  - Consumer state: unique(consumer_name, event_id) to prevent duplicate processing; checkpoint by sequence for streaming.
  - Retry policy per consumer; DLQ per consumer with last_error and attempts.
  - Subscription filtering by schema_id prefix (supports wildcards, e.g., customer.*@v1).
  - Replay: consumers can seek by sequence range and reprocess without republishing.

- API Endpoints (internal only; service-to-service)
  - POST /internal/events/ingest
    - Auth: service token + HMAC signature; scopes: events:publish.
    - Body: headers + payload; validates against schema_id@version; writes to outbox.
    - Responses: 202 Accepted with event_id; 400/422 on validation; 409 on duplicate event_id.
  - GET /internal/event-log
    - Auth: events:read.
    - Query: after_sequence, tenant_id (optional), schema_id (optional), limit<=1000.
    - Response: ordered events with headers + payload_redacted.
  - GET /internal/event-schemas
    - Lists schema_id versions and compatibility status.

- Data Models (Prisma/PostgreSQL)
  - outbox_messages: id(uuid), tenant_id, event_id, schema_id, schema_version, headers(jsonb), payload(jsonb), dedupe_key, not_before, attempts, created_at.
  - event_log: sequence(bigserial), event_id(uuid), tenant_id, schema_id, schema_version, headers(jsonb), payload_redacted(jsonb), payload_hash, published_at.
  - consumer_events: consumer_name, event_id, processed_at, attempts, last_error, status(enum).
  - dlq_messages: consumer_name, event_id, failure_reason, payload_snapshot, created_at.

- Packages and File Paths
  - packages/events/src/schemas/<domain>/<event>@vN.ts (Zod + JSON Schema export)
  - packages/events/src/publish.ts (outbox enqueue)
  - packages/events/src/validate.ts (schema registry lookup)
  - apps/api/src/routes/internal/events.ts (Hono routes)
  - apps/api/src/workers/outbox-relay.worker.ts (BullMQ)
  - apps/api/src/workers/consumers/<consumer>.worker.ts
  - packages/db/prisma/schema.prisma (models above)

- Security and Compliance
  - Multi-tenant isolation via tenant_id; enforce in queries and ingestion.
  - RBAC via Better-auth service tokens; scopes: events:publish, events:read.
  - PII redaction before persistence to event_log; maintain pii_tags in headers.
  - Trace propagation: include trace_id/span_id in headers; emit OpenTelemetry spans for publish/consume.

- Performance and Reliability
  - Throughput target: ≥100 events/sec sustained; p95 end-to-end publish-to-log <2s.
  - At-least-once delivery with idempotent consumers; duplicate processing rate <0.1%.
  - SLO: 99.9% successful publishes; <0.5% messages to DLQ.

User Stories
- As a module developer, I can publish a versioned event with schema validation and get an event_id immediately.
- As a downstream service, I can consume events exactly-once per event_id and replay from a sequence checkpoint.
- As an auditor, I can query an immutable event history by tenant and correlation_id without exposing PII.

Technical Considerations
- Use Redis/BullMQ for outbox relay and consumer workers; backpressure aligned with DB load.
- Enforce immutability via DB permissions/triggers preventing UPDATE/DELETE on event_log.
- Schema deprecation policy documented in packages/events/README.md with migration timelines.
- Observability: Sentry error capture; PostHog event for publish/consume; metrics: publish_latency_ms, relay_lag_sequences, consumer_retry_count.

Success Criteria
- All modules publish via outbox; direct event_log writes disabled.
- JSON payloads validate against registered schemas; schema violations rejected at ingest.
- Event log exhibits strict append-only behavior; sequence gaps only for failed inserts.
- Consumers demonstrate idempotency under induced duplicates; DLQ captures failures with actionable context.
- Traces link domain action → outbox → relay → consumer with shared correlation_id.

