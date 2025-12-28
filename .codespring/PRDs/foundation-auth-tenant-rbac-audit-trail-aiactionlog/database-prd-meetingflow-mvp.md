## Feature Overview
MeetingFlow MVP persists consent, meeting audio, Whisper transcripts, and AI outputs (summaries and action items) with a review-first, human-approval gate. The schema enables event-driven processing, immutable auditing, idempotent jobs, and pgvector-powered retrieval over transcript segments.

## Requirements
- Persist meetings and participants; enforce consent before recording/transcription. Track consent events with evidence and revocation.
- Store uploaded audio metadata (R2 object), create transcription jobs (Whisper), capture transcripts and aligned segments.
- Generate AI outputs (summary, action_items) tied to transcripts; store model/prompt metadata, costs, and idempotency hashes.
- Require human review before publishing; persist review decisions and audit every state change. Materialize approved action items.
- Emit outbox events for state transitions (upload_complete, transcription_completed, ai_output_ready, review_approved) and append to immutable event_log.

Relationships
- meetings 1..N media_assets, transcription_jobs, transcripts, ai_generations, action_items, consent_records, meeting_participants.
- transcription_jobs 1..1 transcripts; transcripts 1..N transcript_segments.
- ai_generations (summary/action_items) reference input_transcript_id; action_items reference source_generation_id.

Indexes & Constraints
- Uniqueness: transcription_jobs(media_asset_id, input_hash), ai_generations(meeting_id, type, input_hash), outbox_events(dedup_key) unique when provided.
- Foreign-key indexes on all *_id columns; composite indexes: transcript_segments(transcript_id, start_ms), ai_generations(meeting_id, type, created_at DESC).
- Vector: transcript_segments(embedding) IVFFLAT/HNSW with appropriate lists per org scale.
- JSONB GIN on ai_generations.content for key lookups.

## User Stories
- As a contractor, I capture participant consent and start recording; the system blocks processing if consent is missing.
- As ops staff, I review AI-generated summary/action items, request changes, and approve for publish.
- As a PM, I query meetings to see latest approved summary and published action items quickly.

## Technical Considerations
- RLS by org_id on all tables; references to users/contacts/leads exist out-of-scope via UUIDs.
- Versioning: store schema_version and prompt_version for AI artifacts; keep model metadata for reproducibility.
- Idempotency: deterministic input_hash for transcription and generation (media + params or transcript + prompt); reject duplicates via unique constraints.
- Eventing: write to outbox_events within same transaction as state change; a publisher relays to bus. Mirror to immutable event_log.
- Data Migration
  - Migration 1: create extensions (pgvector), base tables, RLS policies, primary indexes.
  - Migration 2: add embeddings to existing transcripts by chunking segments async; backfill ai_generations.content schema_version.
  - Zero-downtime: additive columns first; populate; then enforce NOT NULL/uniques.
- Query Optimization
  - Hot paths: meeting overview by meeting_id with latest approved ai_generations(type IN ('summary','action_items')); support via composite indexes and partial index on status='approved' and published=true.
  - Segment search: vector ANN on embedding; filter by transcript_id then vector distance.
  - Large text stored once in transcripts.full_text; segments for granular queries.

## Success Criteria
- Data integrity: no transcription or generation rows without prior consent; enforced by app logic and validated via audits.
- Performance: P95 meeting overview query < 200ms; vector search top-5 segments < 150ms for transcripts up to 2 hours.
- Review compliance: 100% of ai_generations published only after review_decisions.status='approved'.
- Observability: 100% state transitions present in event_log; outbox publish success rate ≥ 99.9% with retries.
- Idempotency: duplicate ingestion/generation attempts do not create new rows (collision on unique hashes).


