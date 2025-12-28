Feature Overview
Shared, canonical event foundation enabling module interoperability via an outbox pattern, immutable append-only event log, and versioned event schemas. Guarantees idempotent consumption, ordering per partition, and traceability for AI audit and compliance.

Requirements
- Canonical events use versioned schemas; only active schemas accepted for publication.
- Outbox writes occur in the same DB transaction as domain state changes; dispatcher publishes and moves records to the event log.
- Event log is immutable append-only with a global monotonically increasing sequence for ordering and replay.
- Idempotent consumers: dedupe by event_id/dedupe_key and track per-consumer progress and processed events.
- Multi-tenant awareness via tenant_id and optional partition_key for ordered delivery.
- Correlation/causation metadata for end-to-end tracing and audit.
- Backpressure and retry with exponential attempts; safe concurrency via row-level locks (lock_owner/lock_expires_at).

Data Model and Schema Design
- event_schemas catalogs canonical event types and their semver versions (status: draft/active/deprecated). schema (TEXT) stores JSON Schema (validated in app layer; use JSONB in Postgres).
- outbox_messages stores pending domain events with dispatch state, dedupe keys, and locks for workers.
- event_log is the append-only store of published events, keyed by sequence (global order) and event_id. Includes metadata for traceability and queryability.
- consumer_offsets stores per-consumer, per-partition last processed sequence (ordered consumers).
- event_consumptions stores per-consumer event receipts to ensure idempotency and at-least-once processing safety.

Table Structures and Relationships
- outbox_messages.event_key + version_* must exist in event_schemas (FK). After successful publish, event_log.outbox_id references outbox_messages.id.
- event_log.event_key + version_* must exist in event_schemas (FK). Unique(dedupe_key) prevents duplicate inserts.
- Unique(consumer_name, event_id) in event_consumptions enforces idempotency. Unique(consumer_name, partition_key) in consumer_offsets.

Indexes and Constraints
- outbox_messages: partial index where published_at IS NULL for dispatcher; index(lock_expires_at), index(priority, occurred_at), unique(dedupe_key), index(tenant_id, occurred_at).
- event_log: PK(sequence) clustered; unique(event_id); unique(dedupe_key); index(tenant_id, occurred_at); index(event_key, occurred_at); index(aggregate_id); index(correlation_id); index(causation_id); index(partition_key, sequence). Consider GIN on payload if stored as JSONB.
- event_schemas: unique(event_key, version_major, version_minor, version_patch); unique(event_key, version_major) where status='active' to allow one active major at a time.
- consumer_offsets: unique(consumer_name, partition_key).
- consumer_consumptions: unique(consumer_name, event_id); index(sequence) for replay joins.
- event_log is immutable: DB rule/trigger denies UPDATE/DELETE.

Data Migration Strategies
- Bootstrap: seed core schemas (v1.0.0) with checksums; enforce publication only against active schemas.
- Versioning: allow parallel publish of old/new majors; producers may dual-write during migrations. Consumers upgrade by major; provide mapping docs. Mark deprecated_at, then freeze.
- Backfill: if legacy outbox rows exist, dispatcher replays by oldest occurred_at. Ensure dedupe_key stability to avoid duplicates.
- Partitioning: for scale, monthly partitions on event_log by received_at; do not partition initially, but design sequence monotonicity to support later partitioning.

Query Optimization Considerations
- Use sequence range scans for replay and offsets. Co-locate consumer_offsets updates with processing to minimize contention.
- Prefer partition_key-affine consumers to preserve order without cross-partition locks.
- Store payload as JSONB in Postgres for GIN paths; keep select projections narrow (avoid SELECT payload for listing screens).

User Stories
- As a module, when I commit a domain change, the corresponding event is guaranteed to publish once and be visible in the event log.
- As a consumer, when I receive duplicate deliveries, I process the event at most once.
- As an auditor, I can trace a customer lifecycle via correlation_id across modules.

Technical Considerations
- All timestamps UTC. payload/headers are immutable; headers may include schema hash, producer version, and redaction flags.
- Dedupe key derived from (event_key, version_major, aggregate_id, occurred_at, payload hash, correlation_id).
- Enforce maximum payload size (e.g., 256 KB) at application layer; large blobs go to object storage with references.

Success Criteria
- <1% dispatcher retry rate; zero duplicate inserts into event_log over 10k events.
- 100% schema validation pass for published events.
- Consumers recover from restarts without missed or duplicated side effects.
- Full audit trace (correlation_id) available end-to-end for MVP flows.

