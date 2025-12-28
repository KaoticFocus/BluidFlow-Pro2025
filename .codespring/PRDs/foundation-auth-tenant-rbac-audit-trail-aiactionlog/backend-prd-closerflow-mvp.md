Feature Overview
CloserFlow MVP enables backend lead capture, next-best discovery questions, approval-gated AI follow-ups, and assembly of scope/estimate/proposal drafts. All AI outputs are review-first, tenant-scoped, RBAC-enforced, event-driven, and auditable with immutable events and AI action logs.

Requirements
- Data models (Prisma, packages/db):
  - Lead: id, tenantId, primaryContactId, stage enum[new|discovery|proposal|decision], source, notes, createdBy, createdAt/updatedAt, dedupeHash, deletedAt.
  - Contact: id, tenantId, firstName, lastName, email, phone, address, consentFlags, piiRedactionLevel.
  - DiscoveryQuestion: id, tenantId, leadId, text, rationale, status enum[generated|asked|answered|discarded], order, createdBy, createdAt.
  - DiscoveryAnswer: id, questionId, leadId, answerText, attachments[], capturedBy, createdAt.
  - AIDraft: id, tenantId, leadId, type enum[followup_email|followup_sms|scope|estimate|proposal], status enum[draft|approved|sent|rejected|superseded], content (JSON with sections + citations), redactSummary, approverId, approvedAt, sentAt, channelMeta (email/sms), version, aiModel, promptHash.
  - AIActionLog: id, tenantId, leadId, draftId?, action enum[prompt|generation|edit|approve|reject|send], actorId|system, inputHash, outputHash, tokens, cost, citations[], createdAt.
  - EventOutbox: id, tenantId, topic, version, payload JSON, dedupeKey, status enum[pending|published|failed], createdAt.

- API (apps/api/src/routes/leads.ts and subroutes; Hono + Zod):
  - POST /leads
    - Body: contact {firstName,lastName,email?,phone?}, source?, notes?
    - Behavior: RBAC(sales|owner). Tenant-scope. Dedupe by normalized email/phone + open lead; otherwise create. Stage=new. Enqueue LeadCreated.v1. Return lead.
  - GET /leads/:id
    - Returns lead, contact, questions+answers, latest drafts by type.
  - PATCH /leads/:id/stage
    - Body: stage in [new,discovery,proposal,decision], reason?
    - Emits StageChanged.v1 (old→new). Idempotent on same target stage.
  - POST /leads/:id/questions/generate
    - Body: count?, contextNotes?
    - Behavior: Generates N DiscoveryQuestion with rationale, status=generated. Sources via RAG with pgvector (tenant-scoped past Q/A, SOP). Log AIActionLog.
  - POST /leads/:id/questions/:questionId/answer
    - Body: answerText, attachments? (R2 URLs)
    - Sets status=answered and stores DiscoveryAnswer.
  - POST /leads/:id/followups/draft
    - Body: channel email|sms, objective enum[nudge|clarify|schedule], constraints?
    - Creates AIDraft(type=followup_email|followup_sms, status=draft) with citations and redaction notes. No send.
  - POST /leads/:id/scope
    - Generates AIDraft(type=scope). Status=draft. Emits ScopeDrafted.v1.
  - POST /leads/:id/estimate
    - Generates AIDraft(type=estimate). Status=draft. Emits EstimateDrafted.v1.
  - POST /leads/:id/proposal
    - Generates AIDraft(type=proposal). Status=draft.
  - POST /drafts/:id/approve
    - Transitions draft to approved. Records approverId, approvedAt. No external send.
  - POST /drafts/:id/send
    - Preconditions: status=approved; channel configured. followup_* -> send via Resend/Twilio. scope/estimate/proposal -> persist artifact (R2) and mark sent. Transitions to sent. Logs AIActionLog and emits DraftSent.v1.

- Validation and constraints
  - Zod validation; phone/email normalization. Required at least one of email|phone on lead.
  - Max generated questions per call: 10. Max drafts per lead per type per day: 5.
  - PII redaction in AI prompts; include tenant and lead IDs only, no raw secrets.
  - Idempotency-Key header supported on POST endpoints; duplicate keys must not create duplicates.

- RBAC and security
  - Auth via Better-auth; tenant isolation on every query; roles: owner, sales (read/write), technician (read lead, no write).
  - All AI and stage-changing actions logged in AIActionLog with actor.
  - Consent flags required before sending SMS; enforce Twilio compliance.

- Events (packages/events)
  - LeadCreated.v1: {leadId, tenantId, createdBy, stage, contactSummary}
  - StageChanged.v1: {leadId, tenantId, from, to, reason?, changedBy}
  - ScopeDrafted.v1: {leadId, tenantId, draftId, version}
  - EstimateDrafted.v1: {leadId, tenantId, draftId, version}
  - DraftSent.v1: {leadId, tenantId, draftId, type, channel}

User Stories
- As a sales user, I create a lead and immediately receive generated discovery questions to qualify the job.
- After answering questions, I generate and approve a follow-up message, then send via email or SMS.
- I assemble scope, estimate, and proposal drafts, review, approve, and send them with full auditability.

Technical Considerations
- Async AI generation via BullMQ workers (apps/api/src/jobs/aiDraftWorker.ts); clients receive 202 + draft placeholder; polling via GET endpoints.
- OpenAI GPT-4/4o via packages/ai with RAG grounding (pgvector); return citations; store promptHash and model.
- Outbox pattern for all events; idempotent publishers; retries with backoff.
- Observability: trace IDs across request → job → outbox; Sentry for errors; PostHog events for key actions.
- Storage: artifacts to Cloudflare R2; store URLs in AIDraft.content.artifacts[].
- Flagsmith to gate AI features per tenant.

Success Criteria
- 95% of POST actions complete under 300ms excluding AI; AI work offloaded to jobs with median completion <10s.
- 100% of outbound comms blocked until approval; attempts logged and rejected with 403/422.
- All listed events emitted with correct schemas; no duplicate events under retries.
- End-to-end test passes: draft -> approve -> send for email and SMS; scope/estimate/proposal draft/approve/send flows.
- Audit completeness: every AI generation, approval, and send has an AIActionLog entry with citations and actor.

