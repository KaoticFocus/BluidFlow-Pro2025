## Feature Overview
Baseline UI for AI interactions enabling: Whisper-powered transcription, RAG-grounded responses with inline citations, PII redaction by default, and review-first human approval gating. Applies across mobile (Expo React Native) and web (Next.js/Shadcn UI) with consistent components, RBAC-aware controls, and audit-friendly statuses.

## Requirements
- Entry points
  - Global “AI Assist” composer accessible from header FAB (mobile) / top bar (web).
  - “Transcribe” call-to-action within notes, calls, and site visit screens.

- Consent gating
  - Pre-record banner/modal: “Obtain consent to record. This will be stored.” Required checkbox + “Capture consent” button (records timestamp, method, and actor).
  - Consent status chip displayed during/after transcription with link to consent record.
  - Recording blocked without consent unless user has elevated permission and explicit override reason (logged).

- Transcription (Whisper)
  - Recorder with mic button, VU meter, timer, language auto-detect badge.
  - Upload audio file (m4a/mp3/wav) alternative; max size error messaging.
  - Progress states: Recording, Uploading, Transcribing with linear progress; cancellable.
  - Transcript editor: plain text with inline timestamp blocks toggle; user can edit before submit.

- Prompting & settings
  - Composer with prompt textarea and attachment picker (docs/images).
  - Settings panel: “Use knowledge base (RAG)” [default on], “Redaction level” [Standard default; Strict; Off (admin-only)], “Output type” (summary, email draft, estimate note).
  - Disclaimer: “AI output requires approval before sharing.”

- Output & citations
  - Rendered output (markdown-safe) with inline citation markers [1], [2] as superscripts.
  - Citations drawer/side panel: list of sources with title, type, snippet highlight, confidence, link to open source document preview; tapping marker scrolls to source.
  - Ungrounded content flagged with “Needs citation” badges.

- PII redaction
  - Default redacted view: mask patterns (phone, email, address, license, SSN). Redaction chips show categories and counts.
  - Toggle: “Show redacted” (default) / “Request reveal.” Reveal requires RBAC, justification modal, and logs to audit; on success, unredacted values are visible for session only.
  - Hover/focus tooltip explains redaction reason.

- Review-first workflow
  - Status bar: Draft → Pending Review → Approved/Rejected with timestamps and actor.
  - Actions: Approve (requires role), Reject (requires reason), Request Changes (comment).
  - Approval enables downstream “Send/Publish” buttons; disabled until approved.

- Errors & states
  - Explicit states: Idle, Recording, Uploading, Transcribing, Generating, Retrieving, Redacting, Ready, Error.
  - Error toasts with retry; partial results warning if some citations fail.

- RBAC & visibility
  - Role-gated actions: Approve, Reveal PII, Override consent.
  - Read-only mode for homeowner clients (no reveal/approve).

- Responsive & accessibility
  - Mobile: bottom sheets for settings/citations; sticky approval bar.
  - Web: right-side panel for citations; keyboard shortcuts (Cmd/Ctrl+Enter submit, Esc close).
  - A11y: focus management between modal/panels, ARIA labels for mic, live region updates for progress, 4.5:1 contrast.

## User Stories
- As a sales estimator, I record a homeowner call, capture consent, edit the transcript, and generate a grounded summary with citations, then submit for manager approval.
- As a manager, I review AI-generated content with citations, cannot see raw PII by default, and approve once it’s compliant.
- As a tech in the field, I transcribe a voice note and get a redacted job note with source references for quick context.

## Technical Considerations
- Component set: AIComposer, TranscribeRecorder, ConsentModal, OutputViewer, CitationsPanel, RedactionToggle, ApprovalBar, AuditTrailPopover.
- Data contract (display-only): output.body (markdown), output.citations[{id,label,sourceId,snippet,confidence,uri}], pii[{type,masked,hash}], status, audit[{action,user,timestamp}].
- Feature gated via Flagsmith; emit PostHog events for key actions; Sentry breadcrumbs on errors.
- Streaming-friendly UI: progressively render transcript and output; keep skeletons for >300ms.

## Success Criteria
- 95% of AI outputs display at least one citation when RAG is enabled.
- 0 instances of unredacted PII shown to non-privileged users.
- <5% task failure rate; end-to-end median time (record → ready output) ≤ 15s for 60s audio.
- ≥80% of outputs approved without edit on first pass within pilot cohort.
- Telemetry coverage: >90% of flows emit consent, redaction, approval events with IDs for audit.


