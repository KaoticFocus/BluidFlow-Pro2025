## Feature Overview
TaskFlow MVP stores and governs tasks captured via voice, photo, or message, supports task checklists and punch lists, and persists AI-assisted daily plans with human approval gates. The schema enforces auditability, RBAC scoping by organization, event-driven integration, and future-proofing for vector search and text search.

## Requirements
- Persist tasks with origin capture, status, priority, assignment, due/scheduled dates, and PII redaction flags.
- Store captures (voice/photo/message), transcripts, and attachments (Cloudflare R2) linked to tasks and plan items.
- Support task checklists and job punch lists; track completion and ordering.
- Persist daily work plans and ordered plan items; link existing tasks or ad-hoc items.
- Approval gating for AI-generated tasks and daily plans; immutable audit trail of decisions and changes.
- Outbox events for TaskFlow aggregates with idempotency.

## User Stories
- As a crew lead, I create a task from a voice note with photo attachment and assign it to a tech.
- As an owner, I review and approve an AI-generated daily plan before it’s published to the field.
- As a tech, I check off checklist items on a task and attach a completion photo.
- As a PM, I maintain a punch list and convert items to tasks as needed.

## Technical Considerations
### Data model and relationships
- tasks ← message_captures (optional via source_capture_id)
- tasks 1–N task_checklist_items
- punch_lists 1–N punch_list_items; punch_list_items optionally link to tasks
- work_day_plans 1–N work_day_plan_items; plan items optionally link to tasks
- attachments polymorphic to tasks, work_day_plan_items, punch_list_items
- approval_requests link to tasks or work_day_plans; tasks also store denormalized approval fields for queryability
- task_audit_log immutable activity stream across TaskFlow entities
- taskflow_outbox for domain events (event sourcing integration)

### Indexes and constraints
- All tables: id UUID PK; created_at default now(); updated_at managed by app where present; soft delete via deleted_at when present.
- tasks: unique(idempotency_key) nullable; FKs by convention on *_user_id and *_id where applicable (no cascade deletes). Suggested indexes:
  - (organization_id, status, assignee_user_id, due_at)
  - (organization_id, approval_status)
  - partial index where status IN ('open','in_progress')
  - GIN/trigram on search_text (Postgres) for fuzzy search
- message_captures: unique(hash_sha256) for dedupe; index (organization_id, created_at), (type).
- work_day_plans: unique(organization_id, plan_date, owner_user_id) optional; index (organization_id, status, plan_date).
- work_day_plan_items, task_checklist_items, punch_list_items: index (parent_id, sequence_order) and completion flags.
- approval_requests: index (organization_id, status, subject_type, subject_id).
- taskflow_outbox: unique(unique_key) for idempotency; index (processed_at nulls first).
- Constraints enforced via CHECK on enumerated fields (status, priority, type, etc.).

### Data migration strategies
- Create tables with minimal nullable columns; backfill search_text = coalesce(title,'') || ' ' || coalesce(description/transcription_text,'').
- Import MeetingFlow action items into message_captures then upsert tasks with source_capture_id; set idempotency_key from capture hash.
- Generate approval_requests for AI-generated tasks/plans with status 'pending'; link back once approved.
- Stage attachments in R2; record storage_url and media_mime_type; ensure referential integrity for parent records exists before insert.

### Query optimization considerations
- Prefer composite indexes scoped by organization_id for multi-tenant isolation.
- Cover common dashboards: open tasks by assignee/date, pending approvals, today’s plan items by owner.
- Maintain search_text for simple full-text; optional Postgres trigram for better matching. Defer pgvector by storing embedding as TEXT; future migration can add a VECTOR column with HNSW index.
- Use outbox unique_key for exactly-once publication; consumers idempotent on unique_key.

## Success Criteria
- <200 ms P95 queries for: open tasks by assignee; pending approvals; plan for a given date.
- Zero duplicate tasks from identical captures (hash-based idempotency).
- All AI-generated records require approval before status transitions to approved/published.
- 100% of changes recorded in task_audit_log with actor and timestamp.
- Outbox achieves >= once delivery with no duplicate side effects (unique_key enforced).


