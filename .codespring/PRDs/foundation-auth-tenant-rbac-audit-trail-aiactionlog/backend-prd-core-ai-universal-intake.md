Feature Overview
Universal Intake ingests voice, text, photo, and email into normalized, structured records (e.g., Lead, Customer) with deduplication and mandatory human confirmation before creation. It operates tenant-scoped, event-driven, AI-assisted (OpenAI/Whisper), and produces a complete audit trail with citations and redaction.

Requirements
- Inputs
  - Sources: web/mobile text, SMS/MMS, voice calls/voicemails, inbound email.
  - Media: audio (mp3/mp4/wav/m4a, ≤30 min, ≤25 MB), images (jpg/png, ≤25 MB), pdf (≤25 MB).
  - Consent: upstream channel must provide consent metadata; reject if missing per tenant policy.
  - Idempotency: all create/webhook endpoints accept X-Idempotency-Key; duplicate keys return the original result.

- Processing
  - Store artifacts in R2 with tenant-scoped keys; store only references in DB.
  - Transcription: Whisper for audio; OCR for images/PDF where applicable; create unified raw_text.
  - AI structuring: Extract candidate structured objects (Lead, Customer, optional Address, AppointmentIntent) with confidence scores and citations mapping to artifacts/timecodes.
  - Redaction: PII redaction applied before sending any content to OpenAI; store both redacted prompt and full output with masked storage for sensitive fields.
  - Language: detect language, persist; must work for English/Spanish at launch.

- Deduplication
  - Deterministic: exact/normalized match on email, phone.
  - Fuzzy: pgvector cosine similarity on name+address+notes embeddings vs Customer/Lead indexes.
  - Thresholds: hard_match ≥0.90; suggest 0.70–0.89; below ignored. Persist candidate_matches with scores and reasons.

- Review-first and Confirm-before-create
  - No creation of canonical records until a human approves decisions for: create new vs link to existing, field corrections, consent acknowledgment.
  - On approval, create/update canonical records and emit events; on rejection, close submission with reason.

- Output & Events (immutable, versioned)
  - Intake.SubmissionCreated.v1, Intake.Parsed.v1, Intake.DedupeEvaluated.v1, Intake.CandidatesReady.v1, Intake.Confirmed.v1, Intake.Rejected.v1.
  - Post-confirmation: Lead.Created.v1, Customer.Created/Updated.v1, AppointmentIntent.Created.v1 as applicable.

- Validation & RBAC
  - Tenant-scoped; roles allowed: Owner, Admin, Sales, Dispatcher (read/review/confirm); FieldTech read-only.
  - Webhooks authenticated via provider signatures (Twilio, Resend). API via Better-auth. All endpoints enforce tenant and role.

API Endpoints
- POST /v1/intake/submissions
  - Body: { source: 'web'|'mobile'|'sms'|'mms'|'voice'|'email', rawText?, artifactKeys?: string[], language?, consent: {type:'verbal'|'written', timestamp, channel}, metadata? }
  - 201: { submissionId }
- POST /v1/intake/uploads/sign
  - Body: { files: [{mime, size}] }
  - 200: [{key, url, headers, expiresAt}]
- POST /v1/intake/submissions/:id/parse
  - Queues transcription/structuring. 202 with jobId.
- GET /v1/intake/submissions/:id
  - 200: submission, artifacts, extraction, dedupe suggestions, audit (redacted prompts, model, citations).
- POST /v1/intake/submissions/:id/confirm
  - Body: { decisions: { createLead?: boolean, linkLeadId?, createCustomer?: boolean, linkCustomerId?, fieldOverrides?: {...} }, consentAck: boolean }
  - 200: { created: {leadId?, customerId?}, eventsEmitted: [...] }
- POST /v1/intake/submissions/:id/reject
  - Body: { reason }
  - 200
- Webhooks
  - POST /v1/intake/webhooks/twilio/sms (verify X-Twilio-Signature) -> creates submission with artifacts (media urls) and raw text.
  - POST /v1/intake/webhooks/twilio/voice (call status/recording url) -> creates submission, queue transcription.
  - POST /v1/intake/webhooks/email/resend (verify signature) -> creates submission with subject/body/attachments.

Data Model (key fields)
- IntakeSubmission: id, tenantId, source, status: 'received'|'parsed'|'needs_review'|'confirmed'|'rejected', raw_text, language, consent, pii_redaction_applied, embedding, createdBy?, createdAt.
- IntakeArtifact: id, submissionId, type: 'audio'|'image'|'pdf'|'text', r2_key, mime, size, metadata (e.g., audio_duration), sha256.
- IntakeExtraction: id, submissionId, model, output_json (Lead/Customer candidates with confidences), citations[], redacted_prompt_hash.
- IntakeDedupe: id, submissionId, matches: [{entity:'Lead'|'Customer', id, score, reasons[]}].
- Audit entries persisted per step with versioned schemas.

Technical Considerations
- Queues: BullMQ jobs (transcribe, ocr, structure, dedupe); retries with backoff; max attempts 3; idempotent by submissionId.
- Performance: text-only P95 parse <7s; audio end-to-end P95 <120s; webhooks 2xx within 2s (defer heavy work to queues).
- Observability: OpenTelemetry traces per submissionId; Sentry errors; PostHog events for funnel metrics.
- Outbox pattern for all events; consumers idempotent; schema versions in packages/events.
- Security: encrypt phone/email at rest; hashed normalized indexes for deterministic dedupe; signed R2 uploads; strict MIME/size limits.
- Flags: rollout gate via Flagsmith per-tenant; toggle channels (voice/email/SMS).

User Stories
- As a Sales rep, I forward a homeowner email with photos; the system proposes a Lead linked to an existing Customer and I confirm creation.
- As an Owner, I receive a voicemail; the system transcribes, extracts contact and address, suggests dedupe, and I approve to create a Lead.

Success Criteria
- ≥95% of submissions reach needs_review within SLA (text <7s, audio <120s).
- ≥90% precision on hard dedupe matches; zero auto-creates without confirmation.
- 100% of AI actions logged with redacted prompts, model versions, and citations.
- Webhook delivery verified and idempotent (no duplicate records) under retry storms.
- P0 errors: <0.1% job failure rate; PII redaction applied to all AI prompts.

