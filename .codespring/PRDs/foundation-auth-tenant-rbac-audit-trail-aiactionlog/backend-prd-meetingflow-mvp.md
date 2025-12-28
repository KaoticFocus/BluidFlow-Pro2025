## Feature Overview
MeetingFlow MVP enables a consent-gated audio capture workflow that ingests meeting recordings, transcribes with Whisper, and generates AI-drafted summaries and action items for human review and approval. All outputs are review-first, RBAC-controlled, PII-redacted, event-driven, and immutably audited.

## Requirements

- API (all routes under /v1, JSON; Auth: Better-auth JWT; Idempotency-Key supported on POST):
  - POST /meetings
    - Body: { lead_id (uuid), title?, scheduled_at?, participants: [{id, role: 'contractor'|'client'}] }
    - Resp: { meeting_id }
    - Emits: meeting.created.v1
  - POST /uploads/presign
    - Body: { purpose: 'meeting_audio'|'consent_audio', content_type, size_bytes, sha256 }
    - Resp: { upload_url, object_key, expires_at }
    - Validation: max 500MB; content_type in audio/*; size > 0; sha256 required
  - POST /meetings/:id/consents
    - Body: { participant_id, consent_statement_version, object_key? (audio proof), captured_at, geo?: {lat,lng,accuracy_m}? }
    - Resp: { consent_id, status: 'recording_allowed' }
    - Rules: meeting must exist; participant must be client; records immutable audit entry; emits meeting.consent.captured.v1
  - POST /meetings/:id/recordings/complete
    - Body: { object_key, duration_sec?, content_type, size_bytes, sha256, source: 'mobile'|'web' }
    - Resp: { recording_id, transcription_job_id }
    - Rules: requires at least one client consent on meeting; dedupe by object_key+sha256; emits meeting.recording.uploaded.v1; enqueues whisper.transcribe
  - POST /meetings/:id/transcribe
    - Body: { recording_id } or empty to transcribe latest
    - Resp: { transcription_job_id }
    - Rules: starts/reattempts transcription; idempotent per recording
  - GET /meetings/:id/transcript
    - Query: { include='segments'|'none' }
    - Resp: { transcript_id, status: 'queued'|'processing'|'ready'|'failed', language?, duration_sec?, text_redacted?, text_raw?, segments?: [{id, start_s, end_s, text_redacted, text_raw}] }
  - POST /meetings/:id/ai/draft
    - Body: { transcript_id?, locale?, rag_context_ids?: uuid[] }
    - Resp: { draft_id, summary: {text, citations:[{segment_id,start_s,end_s}]}, action_items: [{title, details?, due_date?, assignee_role?}], status: 'pending_review' }
    - Rules: transcript status must be 'ready'; uses redacted transcript; emits meeting.ai_draft.created.v1; enqueues ai.summarize and ai.action_items if async
  - GET /meetings/:id/ai/draft
    - Resp: { draft_id, summary, action_items, created_at, reviewer_status: 'pending'|'approved'|'rejected' }
  - POST /meetings/:id/ai/approve
    - Body: { draft_id, approve: boolean, edits?: {summary_text?, action_items?}, reason? }
    - Resp: { status: 'approved'|'rejected', published_action_item_ids?: uuid[] }
    - Rules: on approve, persist final version, materialize ActionItems, emit meeting.review.approved.v1 and tasks.action_items.published.v1; on reject, require reason, emit meeting.review.rejected.v1

- Business logic and workflows
  - Consent gate: No transcription or AI drafting until at least one client consent exists for the meeting.
  - PII redaction: Store text_raw; generate text_redacted and segment-level redaction spans; only redacted used for AI and default APIs; raw restricted to admins.
  - Review-first: AI drafts never auto-publish; action items only created on approval.
  - RAG grounding (optional): If rag_context_ids provided, include citations to internal docs; persist citation sources.

- Data and persistence (Prisma)
  - Core entities: Meeting, Participant, Consent, Recording (R2 object_key, checksum), Transcript (raw/redacted, segments, language), AiDraft (summary, action_items, citations), ActionItem (status: draft|open), Review, AuditLog.
  - pgvector: store embeddings per transcript segment for future retrieval; not required for MVP generation quality.

- Queues and events
  - BullMQ queues: whisper.transcribe, ai.summarize, ai.action_items; idempotent by recording_id/transcript_id.
  - Outbox events (versioned): meeting.created.v1, meeting.consent.captured.v1, meeting.recording.uploaded.v1, meeting.transcript.ready.v1, meeting.ai_draft.created.v1, meeting.review.approved.v1, meeting.review.rejected.v1, tasks.action_items.published.v1.

- Validation and errors
  - 400: missing consent, invalid media, size/type limits, duplicate upload.
  - 401/403: RBAC (roles contractor: create/upload; reviewer: approve).
  - 409: idempotency conflict; 422: transcript not ready.

- Security and compliance
  - R2 server-side encryption; scoped presign (5 min); checksum verification.
  - RBAC via Better-auth; per-tenant isolation.
  - Immutable AuditLog for consent, uploads, transcription, AI generation, review.
  - Sentry for errors; OTel traces across jobs; PostHog events with PII scrubbed.

- Performance
  - Target P50 end-to-end (upload to draft): <= 5 min for 60-min audio.
  - Concurrency controls to prevent >2 parallel transcriptions per tenant.
  - Rate limits: 20 presign/min/user; 5 AI drafts/min/tenant.

## User Stories
- As a field tech, I upload a meeting recording after capturing client consent; the system transcribes it automatically.
- As an estimator, I review the AI draft summary and action items and approve with edits to publish tasks.

## Technical Considerations
- Whisper: use OpenAI Whisper API; chunk audio >25MB if required; retry with backoff; language auto-detect.
- OpenAI GPT-4/4o for summaries/action items; temperature ≤0.3; return citations mapping to segment IDs and timecodes.
- Feature flags: Flagsmith gates model choice and RAG usage.
- Observability: trace IDs propagated from API through queues; metrics for job latency/success.

## Success Criteria
- ≥95% of recordings produce a transcript and AI draft without manual intervention.
- 100% of summaries/action items require explicit approval before publishing.
- Median pipeline latency (upload complete to draft ready) ≤ 5 minutes for ≤60-minute audio.
- Zero PII exposure in redacted outputs; all events present in audit log with correct linkage.


