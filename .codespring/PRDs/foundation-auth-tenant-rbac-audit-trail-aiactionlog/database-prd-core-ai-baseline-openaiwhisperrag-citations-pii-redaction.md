## Feature Overview
Core AI data foundation to support OpenAI (chat/embeddings), Whisper transcription, Retrieval-Augmented Generation with source citations, PII detection/redaction, consent gating, review-first approvals, and a comprehensive AI audit trail. Designed for multi-tenant, event-driven usage across modules with immutable records and RBAC alignment.

## Requirements
- Persist all AI requests/responses, token/cost telemetry, and audit events per tenant/session.
- Whisper transcription for media assets; segment-level timing and confidence.
- RAG store with chunked embeddings (pgvector) and deterministic citation links from responses to chunks and/or external URLs.
- PII detection results tied to source artifacts (requests, responses, transcriptions, RAG docs) and policy-driven redaction.
- Consent records gating AI processing/transcription per subject and scope; link consent to requests.
- Review-first outputs: queue, decisions (approve/reject/edit), and external-effects gating flag.
- Row isolation by tenant_id; immutable event history.

## Data Model & Schema Design
- ai_session anchors conversational/task context across modules; ai_request captures an AI operation with optional consent and redacted inputs; ai_response stores model output and redacted copy.
- ai_output_review enforces human-in-the-loop approvals before external side-effects.
- RAG: rag_corpus → rag_document → rag_chunk with VECTOR embeddings; ai_citation maps responses to chunks/URLs with character spans and scores.
- Transcription: media_asset → transcription → transcription_segment with timing.
- PII: pii_finding normalizes detections across sources with category, offsets, and chosen redaction.
- ai_policy defines active policy toggles per tenant (auto-approve, redact strictness, store_raw) and category allowlists.
- ai_audit_event logs immutable events with typed payloads.

## Table Structures & Relationships
- One-to-many: ai_session→ai_request→ai_response→ai_output_review; rag_corpus→rag_document→rag_chunk; transcription→transcription_segment.
- Many-to-one: ai_citation→ai_response and →rag_chunk; pii_finding→(polymorphic) source by source_type/source_id.
- Soft invariants: unique (rag_chunk.document_id, chunk_index); rag_document.tenant_id must match corpus.

## Indexes & Constraints
- PKs: id UUID on all tables. FKs: enforce tenant and parent relations where applicable.
- Unique: rag_chunk(document_id, chunk_index).
- Vector: HNSW/IVFFlat index on rag_chunk.embedding (pgvector, fixed dim per deployment).
- Search/filters: indexes on (tenant_id, status) for ai_output_review; (tenant_id, session_id, created_at) for ai_request; (tenant_id, source_type, source_id) for pii_finding; (asset_id) for transcription; (response_id) for ai_citation.
- Checks: enumerated type fields via CHECK; timestamps default NOW(); non-null tenant_id.
- RLS: enable by tenant_id for all tables in this feature.

## Data Migration Strategy
1. Create ai_policy with a seeded default per tenant; set active=true.
2. Create RAG tables; backfill from existing docs if present; compute embeddings asynchronously.
3. Create AI interaction and audit tables; route new traffic; backfill minimal historical summaries if available.
4. Create media/transcription tables; re-link existing audio to media_asset.
5. Enable vector indexes after initial backfill; add review queue with default pending state.

## Query Optimization Considerations
- RAG retrieval: approximate vector index with filter by tenant_id and corpus_id; LIMIT k with score threshold.
- Review queue: compound index (tenant_id, status, created_at DESC) for paging.
- Citations hydration: prefetch by response_id; join to rag_chunk/document for titles/URIs.
- PII lookup: index (tenant_id, source_type, source_id) to render redaction overlays quickly.
- Token/cost analytics: partial index on completed_at IS NOT NULL; aggregate by model/type per day.

## User Stories
- As a reviewer, I see pending AI outputs with linked citations and redacted text and can approve/edit before sending externally.
- As a PM, I can confirm consent exists before transcription runs; if not, the request is blocked and logged.

## Technical Considerations
- Embedding VECTOR dimension must be consistent across deployment.
- Store raw inputs/outputs only if ai_policy.store_raw=true; otherwise persist redacted fields only.
- Payload shapes in ai_audit_event.payload must be versioned.

## Success Criteria
- 100% AI responses in DB with citations (when RAG used), audit entries, and review state.
- PII detections stored for ≥95% of inputs/outputs; redaction applied per policy.
- RAG top-k retrieval P95 < 150ms at 100k chunks/tenant.
- No cross-tenant leakage validated via RLS tests.


