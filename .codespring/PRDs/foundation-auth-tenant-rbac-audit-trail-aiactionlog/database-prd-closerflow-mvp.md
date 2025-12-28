Feature Overview
CloserFlow MVP stores and governs lead intake, AI-generated discovery questions, follow-up drafts, and simple scope/estimate/proposal assemblies with strict review-first approval. It provides an auditable, event-driven data model aligned to multi-tenant RBAC and external send gating.

Requirements
- Lead lifecycle: stages new → discovery → proposal → decision with immutable stage history and event emission (LeadCreated.v1, StageChanged.v1).
- Discovery Q&A: store AI-generated next-best questions (with embeddings, prompts, model, citations) and captured answers.
- Drafting: persist AI drafts for follow-up email/SMS and documents (scope, estimate, proposal) with statuses draft → under_review → approved → sent; enforce approval before external side-effects; store citations and prompts.
- Document assembly: simple estimate line items and proposal acceptance marker.
- Auditability: AI action log of prompts/outputs (redacted), latency, citations; immutable outbox events with idempotency.

Data Model and Schema Design
- Multi-tenant: every row keyed by tenant_id; all queries constrained by tenant_id.
- Core entities: leads (owner), lead_contacts (primary + others), discovery_questions/answers, ai_drafts (+ recipients, assets), estimate_items, proposal_acceptances.
- Workflow: stage transitions recorded in lead_stage_history; ai_drafts status drives approval and sending; outbox_events captures domain events for async consumers.
- Enumerations (stored as VARCHAR):
  - leads.stage: new|discovery|proposal|decision
  - ai_drafts.type: followup_email|followup_sms|scope|estimate|proposal
  - ai_drafts.status: draft|under_review|approved|rejected|sent
  - draft_recipients.type: to|cc|bcc|sms_to
  - draft_assets.asset_type: rendered_pdf|attachment

Table Structures and Relationships
- leads 1—N lead_contacts, discovery_questions, discovery_answers, ai_drafts, lead_stage_history, estimate_items (via draft), proposal_acceptances (for proposal draft).
- ai_drafts 1—N draft_recipients, draft_assets; estimate_items rows optionally scoped to an estimate draft.
- outbox_events references lead as aggregate; events are immutable and idempotent via dedupe_key.

Indexes and Constraints
- All PKs UUID. Composite unique constraints (documented for implementation):
  - lead_contacts(tenant_id, lead_id, email/phone) partial null handling via functional unique indexes.
  - outbox_events(dedupe_key) unique.
  - ai_drafts(tenant_id, lead_id, type, draft_version).
- Foreign key constraints on tenant_id and parent ids; ON DELETE CASCADE for child rows.
- Common indexes:
  - leads: (tenant_id, stage), (tenant_id, created_at DESC), GIN on (title, description) via trigram optional.
  - discovery_questions: (tenant_id, lead_id, status), pgvector index on vector with IVFFlat/HNSW plus filter on lead_id.
  - ai_drafts: (tenant_id, lead_id, status), partial index WHERE status IN ('approved','sent').
  - lead_stage_history: (tenant_id, lead_id, changed_at DESC).

Data Migration Strategies
- Migration v1: create all tables + enums (as VARCHAR with CHECK in app layer for MVP), pgvector extension, indexes.
- Seed minimal stages; no backfill required. Future migrations append-only, never destructive; add version field to outbox_events.
- Event backfill: emit LeadCreated.v1 for existing seeded leads via jobs.

Query Optimization Considerations
- Always predicate queries with tenant_id.
- Use covering indexes for stage lists and review queues (ai_drafts by status).
- For next-best questions, use ANN on vector with WHERE lead_id = $1 ORDER BY cosine_distance.
- Draft list pages SELECT only id, type, status, updated_at; lazy-load content_md/json_payload.

User Stories
- As a sales user, I can capture a lead, see stage, and primary contact.
- I can review AI-generated questions, record answers, and approve/reject drafts.
- Upon approval, the system enqueues send operations and records events and audit logs.

Technical Considerations
- Review-first: ai_drafts.status must be approved before sent_via is set or external_message_id stored.
- PII: store only necessary contact fields; redact inputs/outputs in ai_action_log.
- Idempotency: outbox_events.dedupe_key unique; consumers idempotent.

Success Criteria
- Leads progress through stages with corresponding events.
- Discovery questions stored with embeddings and citations; answers captured.
- Drafts are created, approved, and sent with full audit trail and outbox events.

