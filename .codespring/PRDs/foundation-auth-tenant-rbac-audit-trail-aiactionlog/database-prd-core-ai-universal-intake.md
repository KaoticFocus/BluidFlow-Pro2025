## Feature Overview
Universal Intake normalizes multi-channel inputs (voice, SMS/MMS, email, photos, notes) into structured, deduplicated, review-gated records. It centralizes raw content, AI outputs (transcription/extraction/embeddings), review decisions, and emits outbox events only after human approval.

## Requirements
- Multi-tenant idempotent ingestion with confirm-before-create; no external side effects prior to approval.
- Source-agnostic: voice (Whisper), text, photo (OCR), email; attachments persisted to R2; PII redaction stored alongside raw.
- AI pipeline traceability: transcription, extraction, embeddings, costs, latency, versions.
- Dedupe across existing entities using rules + vector similarity; explicit reviewer selection.
- Immutable audit trail and event outbox; versioned schemas.

## Data Model and Schema Design
- universal_intake_items: root artifact per intake; threading, status, idempotency hash, PII redaction, metadata.
- universal_intake_attachments: R2-backed artifacts (audio/image/pdf) + checksums, basic media attributes, optional OCR text.
- universal_intake_transcripts: Whisper outputs per attachment or item.
- universal_intake_extractions: GPT structured extraction payload with schema/prompt versions and citations.
- universal_intake_embeddings: pgvector embeddings for similarity-based dedupe and retrieval (store redacted text only).
- universal_intake_entities: proposed target entities (e.g., customer, project) with provisional data and action.
- universal_intake_matches: dedupe candidates linking proposals to existing records with score/method.
- universal_intake_reviews: reviewer decisions and snapshots enabling confirm-before-create.
- universal_intake_ai_calls: audit of AI invocations (cost/tokens/latency/errors).
- intake_outbox_events: outbox for event-driven publishing post-approval.

Relationships: items 1—N attachments/transcripts/extractions/embeddings/entities/reviews/ai_calls; entities 1—N matches. All rows scoped by tenant_id.

## Table Structures and Relationships
- See tables list; FK expectations: *_id fields reference their parent tables; target_id/matched_id reference domain tables (external), stored as UUID.

## Indexes and Constraints
- universal_intake_items: PK(id), UNIQUE(tenant_id, ingestion_hash), IDX(tenant_id,status,received_at DESC), IDX(tenant_id,thread_id), GIN(metadata), FK(parent_item_id, duplicate_of_item_id -> items).
- universal_intake_attachments: PK, IDX(intake_item_id), UNIQUE(tenant_id, sha256), IDX(tenant_id, type).
- universal_intake_transcripts: PK, UNIQUE(attachment_id, engine, model).
- universal_intake_extractions: PK, UNIQUE(intake_item_id, prompt_version, schema_version), GIN(extracted_json).
- universal_intake_embeddings: PK, IVFFLAT index on (embedding) WITH (lists tuned per table size), IDX(tenant_id, intake_item_id, content_type).
- universal_intake_entities: PK, IDX(tenant_id, status), GIN(provisional_data), CHECK(action in create|update|link|ignore).
- universal_intake_matches: PK, UNIQUE(entity_id, matched_table, matched_id, method), IDX(tenant_id, score DESC).
- universal_intake_reviews: PK, IDX(tenant_id, intake_item_id, decided_at DESC).
- universal_intake_ai_calls: PK, IDX(intake_item_id), IDX(created_at).
- intake_outbox_events: PK, IDX(status, created_at), IDX(tenant_id, aggregate_id).

## Data Migration Strategies
- Enable pgvector extension; create schemas/tables with tenant_id NOT NULL; backfill ingestion_hash for any pre-existing data with SHA256(channel+source_id+timestamp bucket).
- Create IVFFLAT index post-warmup with appropriate lists; run VACUUM/ANALYZE.
- Initialize status to "received"; migrate redacted_text from raw_text via batch job.

## Query Optimization Considerations
- Always predicate by tenant_id; use covering indexes for review queue (tenant_id,status='awaiting_review',received_at DESC).
- Store embeddings from redacted_text/ocr to reduce sensitive content exposure.
- Use JSONB GIN on provisional_data/extracted_json for filterable fields (e.g., zipcode, job type).
- Vector search constrained by tenant_id, then ANN, then exact re-ranking by cosine.

## User Stories
- As an estimator, I approve a proposed "Customer + Project" from an MMS with photos; duplicate matches are shown and I select an existing Customer.
- As a crew lead, I dictate a note; Whisper transcribes, extraction proposes a Task; I approve and an event is emitted.

## Technical Considerations
- Multi-tenant RBAC via tenant_id and reviewer_user_id; immutable audit via ai_calls + reviews + outbox events.
- PII redaction stored and preferred for embeddings; raw retained per retention_until.
- Idempotency enforced by (tenant_id, ingestion_hash) per channel/source.

## Success Criteria
- >95% successful AI pipeline runs without manual retries; <500ms P95 query latency for review queue; dedupe selection displayed within 200ms after extraction; zero side effects without approval; complete, queryable audit for 100% of intakes.

