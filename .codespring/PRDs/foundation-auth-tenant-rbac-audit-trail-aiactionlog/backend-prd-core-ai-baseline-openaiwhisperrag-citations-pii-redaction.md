# Core AI Baseline: OpenAI/Whisper/RAG + Citations + PII Redaction

## Feature Overview
Provide a unified backend service for AI across the suite: OpenAI models for generation, Whisper for transcription, RAG retrieval with explicit citations, and a mandatory PII redaction + consent gate. All AI outputs are review-first (drafts) with immutable audit trails and no external side effects until approved.

## Requirements

- OpenAI integration
  - Models: gpt-4o or gpt-4o-mini for generation; text-embedding-3-large for embeddings; whisper-1 for transcription.
  - All prompts constructed server-side; client cannot override system instructions.
  - Streaming optional; default non-streamed for audit completeness.

- RAG + citations
  - Retrieval from pgvector-backed store; topK=8 (configurable), max_context_tokens=3,000.
  - Every answer sentence must map to ≥1 retrieved chunk; return citations with source metadata and spans.
  - If <70% of sentences cite a source, flag output as low_confidence=true and requires_review=true.

- PII redaction + consent gating
  - PII categories: email, phone, address, name, SSN, CC, bank, license, geo(lat/long), device IDs.
  - Consent check for each subject (e.g., homeowner) before sending any PII to OpenAI.
  - Default policy: redact before send; allow-block policy toggle per tenant.
  - Return both redacted_output and pii_entities; raw_output accessible only to roles with scope ai.view_unredacted.

- Review-first outputs
  - All AI outputs persisted as ai_output drafts; require explicit approve/reject before any write or external action.
  - No emails/SMS/record mutations triggered by AI without approval event (unless tenant setting overrides).

- Immutable AI audit
  - Persist request/response metadata, token counts, citations, redaction artifacts, consent status, model + version, prompt hash.
  - Store raw inputs/outputs encrypted (AES-256) if allowed; otherwise only redacted text.

## API Endpoints (Hono, JSON; Zod-validated)

- POST /v1/ai/generate
  - body: { task: 'qa'|'summarize'|'transform'|'draft', input_text?: string, query?: string, context?: {customerId?, projectId?, module?}, attachments?: string[], stream?: boolean, consentSubjects?: string[], redactionPolicy?: 'redact'|'block' }
  - 200: { draftId, output_redacted, citations: Citation[], pii: Entity[], low_confidence, auditId, usage: {prompt_tokens, completion_tokens} }
  - Rules: enforce consent; perform RAG for task='qa' and when context provided; require ≥1 citation; if block policy and PII found without consent -> 403.

- POST /v1/ai/rag/query
  - body: { query: string, filters?: {customerId?, projectId?, module?}, topK?: number }
  - 200: { results: RetrievedChunk[] }

- POST /v1/ai/transcriptions
  - body: { fileId?: string, uploadUrl?: string, languageHint?: string, consentSubjects?: string[] }
  - 202: { jobId }
  - Flow: enqueue BullMQ job; fetch from R2 via fileId or signed URL; run Whisper; redact + audit; emit ai.transcription.completed.

- GET /v1/ai/transcriptions/:jobId
  - 200: { status: 'queued'|'processing'|'completed'|'failed', transcript_redacted?, pii?, auditId?, error? }

- POST /v1/ai/redactions
  - body: { text: string, policy?: 'strict'|'standard', mask?: '****'|'[REDACTED]' }
  - 200: { text_redacted, entities: Entity[] }

- POST /v1/ai/outputs/:draftId/approve
  - body: { note?: string }
  - 200: { status: 'approved' }
  - Emits ai.output.approved; no external side effects here—downstream modules may subscribe.

- POST /v1/ai/outputs/:draftId/reject
  - 200: { status: 'rejected' }

## Data Model (Prisma, PostgreSQL, pgvector)

- rag_sources(id, tenantId, sourceType, sourceId, uri, title, metadata jsonb, createdAt)
- rag_chunks(id, sourceId fk, ordinal, text, tokens, createdAt)
- rag_embeddings(id pk=fk rag_chunks.id, embedding vector(3072))
- ai_outputs(id, tenantId, userId, task, input_hash, output_redacted, output_encrypted?, citations jsonb, pii jsonb, low_confidence, review_status enum('pending','approved','rejected'), createdAt)
- ai_audits(id, tenantId, userId, model, version, prompt_hash, prompt_encrypted?, response_hash, tokens jsonb, consent jsonb, redaction_policy, request_meta jsonb, createdAt)

## Events (outbox; packages/events)

- ai.output.created {id, tenantId, task, low_confidence}
- ai.output.approved {id, tenantId}
- ai.transcription.completed {jobId, transcript_redacted, pii}
- ai.embedding.created {chunkId}
All events idempotent; include schema version; persisted then published.

## Business Rules

- RBAC: scopes required
  - ai.generate, ai.transcribe, ai.redact; ai.view_unredacted for raw.
- Rate limits: 60 req/min/user for generate; 10 concurrent transcription jobs/tenant.
- Timeouts: generate 45s; transcribe job 5 min; rag.query 2s.

## Technical Considerations

- File paths
  - apps/api/src/routes/ai.ts
  - packages/ai/src/openai.ts, rag.ts, redact.ts, citations.ts, consent.ts
  - packages/events/src/schemas/ai/*.ts
  - packages/db/prisma/schema.prisma
  - apps/api/src/queues/aiTranscribe.worker.ts, aiEmbed.worker.ts

- Retrieval
  - Cosine similarity on pgvector; normalize embeddings; hybrid BM25 optional (future).

- Citations schema
  - { sourceId, chunkId, sourceUri, title, confidence: 0-1, text_span: {start,end}, chunk_offset: {start,end} }

- Observability
  - OpenTelemetry spans per request; Sentry breadcrumbs; scrub PII before logging.

- Security
  - Better-auth JWT; tenant isolation; encryption at rest for raw payloads; forbid storing API keys in DB.

## User Stories

- As a sales rep, I ask “What did we promise Mrs. Lee?” and receive a cited, redacted answer I can approve to add to notes.
- As a crew lead, I upload a jobsite voice memo; get a redacted transcript with detected PII marked.
- As an owner, I require consent before any homeowner PII is sent to OpenAI; otherwise block or auto-redact per policy.

## Success Criteria

- 99% of AI responses include ≥1 citation; ≥70% sentence coverage.
- ≤2% blocked requests due to missing consent when policy=redact; 0 leakage of unredacted PII to logs.
- P50 latency: generate ≤4s (non-stream), rag.query ≤1.5s, transcription job P95 ≤90s for 5 min audio.
- 100% AI operations recorded in ai_audits with verifiable prompt/response hashes.
- Review-first: 100% ai_outputs start as pending; no external side effects emitted before approval.


