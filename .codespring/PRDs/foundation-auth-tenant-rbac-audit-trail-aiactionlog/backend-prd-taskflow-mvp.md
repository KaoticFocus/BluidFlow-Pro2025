# TaskFlow MVP

## Feature Overview
Enable creation and management of tasks from voice, photo, and text messages, including checklist and punch list support. Generate AI-assisted daily plans from existing tasks and recent notes, with mandatory human approval before publishing. All AI outputs are review-first, redacted, cited, and immutably audited.

## Requirements

- Task creation
  - Sources: message (text), voice (audio), photo (image). Store attachments in R2; reference by attachment_id.
  - Voice: transcribe via Whisper; extract proposed tasks/checklists via GPT-4/4o with grounded RAG and citations; mark as ai_generated and pending_approval.
  - Photo: optional AI caption and task suggestion (same gating).
  - Text: create task directly; user may include checklist items.
  - Punch list: tasks flagged type=punch or tag=punch for filtering and reporting.

- Approvals and statuses
  - Status states: draft → pending_approval → approved → open → in_progress → done (canceled allowed).
  - AI-derived entities (tasks, daily plans) must be approved by users with role: manager|owner before they become active.

- Daily plan generation
  - Input: org_id, project_id (optional), date. Use open tasks, recent MeetingFlow decisions, and constraints to propose a plan.
  - Output: DailyPlan with ordered items (task references, time blocks, crew hints), citations, redacted text. Status: pending_approval until approved/published.

- Data validation
  - Attachments: audio (m4a, mp3, wav, <20MB), images (jpg, png, heic, <15MB).
  - Text limits: task.title ≤ 140 chars, description ≤ 5,000 chars; checklist items ≤ 50 per task; tags ≤ 10 per task.
  - Due date must be ≥ today; assignee must belong to org and project (if set).

- Security and RBAC
  - Auth via Better-auth. Roles: owner, manager, estimator, field, client.
  - Access scope: org + project scoping; client read-only to tasks explicitly shared.
  - PII redaction on all AI outputs by default. Store redacted_text; keep raw transcript only if consent=true and encrypt at rest.
  - Immutable audit trail on create/update/approve with actor, before/after, reason, ai_metadata.

- Observability and performance
  - Whisper transcription p95 < 20s for 5 min audio (async job).
  - Task create/read p95 < 200ms (excluding async AI).
  - Idempotent POSTs via Idempotency-Key header (24h window).
  - Rate limits: 60 req/min/user; upload presign 20/min/user.

### API Endpoints (Hono, JSON, Zod-validated)
- POST /v1/uploads/presign
  - body: { type: "audio"|"image", mime_type, size_bytes }
  - 200: { upload_url, attachment_id, expires_at }
- POST /v1/tasks
  - body: { org_id, project_id?, source: "text"|"voice"|"photo", title?, description?, attachment_id?, checklist?: [{title, due_date?, assignee_id?}], tags?: [string], type?: "general"|"punch", consent?: boolean }
  - 201: { task: Task, ai_job_id? } (voice/photo triggers async jobs; status=pending_approval)
- PATCH /v1/tasks/:id
  - body: { title?, description?, checklist?, due_date?, assignee_id?, status?, tags? }
  - Validation blocks status regressions except approved→open, open→in_progress, *→done/canceled.
- POST /v1/tasks/:id/approve
  - body: { note? } → transitions pending_approval→approved (and open if actionable)
- GET /v1/tasks/:id; GET /v1/tasks?filters…
- POST /v1/daily-plans/generate
  - body: { org_id, project_id?, date, constraints? }
  - 202: { daily_plan_id, ai_job_id }
- GET /v1/daily-plans/:id
- POST /v1/daily-plans/:id/approve | /publish | /reject

### Data Models (key fields)
- Task: { id, org_id, project_id?, created_by, assignee_id?, source, title, description_redacted, attachments[], type, status, due_date?, priority?, tags[], checklist_items[], ai_generated, citations[], consent, audit_ref, created_at, updated_at, version }
- DailyPlan: { id, org_id, project_id?, date, items:[{task_id, order, time_block?}], notes_redacted?, citations[], status, ai_generated, audit_ref, created_at }

### Events (outbox; versioned)
- task.created v1, task.updated v1, task.approved v1, task.status_changed v1
- media.transcribed v1, ai.tasks.proposed v1
- dailyplan.generated v1, dailyplan.approved v1, dailyplan.published v1
- All events include: event_id, occurred_at, actor_id?, org_id, project_id?, entity_id, schema_version, idempotency_key.

## User Stories
- As a field lead, I record a 2-minute voice note; the system proposes 3 tasks with a checklist, which I review and submit for manager approval.
- As an owner, I approve today’s AI-generated daily plan and publish it to the crew.
- As a technician, I view my assigned punch list items and check off completed checklist steps.

## Technical Considerations
- Async jobs (BullMQ): transcription.queue, ai.extract.queue, ai.dailyplan.queue; retries with backoff; poison queue on failure.
- RAG: project context + recent MeetingFlow transcripts; store citations with source_ids.
- Storage: R2 for media; signed URLs; attachments table with hash for dedupe.
- Search: pgvector embeddings on task title/description for future smart lookup; basic text search for MVP.
- Compliance: Sentry, PostHog, OTel traces; Resend notifications on approvals; Flagsmith to gate AI features.
- Twilio inbound (optional MVP): webhook to create text/photo task with consent flag and sender mapping.

## Success Criteria
- 95% of AI-generated tasks/daily plans require ≤2 field edits before approval.
- p95 API latency targets met; zero PII leaks in stored non-consented content.
- End-to-end audit present for 100% of approvals and AI generations.
- Event emission coverage 100% with idempotent consumers verified in staging.
- At least 10 daily plans published and 200 tasks created across sources without critical errors.


