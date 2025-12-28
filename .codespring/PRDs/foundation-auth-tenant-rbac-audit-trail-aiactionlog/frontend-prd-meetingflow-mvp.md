# MeetingFlow MVP

## Feature Overview
Mobile-first, three-step flow to capture homeowner consent, record or upload meeting audio, and review AI-generated transcript, summary, and action items before approval. All outputs are draft until human-approved; approved artifacts become read-only and publishable to downstream modules.

## Requirements

- Flow and Navigation
  - Entry points: Lead detail and Meeting detail pages (“Start Meeting”).
  - Stepper header: 1) Consent, 2) Capture, 3) Review & Approve. Persist state per meeting.
  - Unsaved changes warning when navigating away during edits.

- Consent Capture (required before recording/upload)
  - Consent screen includes: homeowner name, contact (optional), location, timestamp auto-capture.
  - Disclosure text (static copy) + required checkbox “I have informed and obtained consent.”
  - Option to record a 5–10s verbal consent snippet; or typed attestation (name + checkbox). One is required.
  - Display banner “Consent recorded” with who/when; immutable after capture.
  - Read-only consent summary visible in later steps.

- Audio Capture / Upload
  - Tabs: Record | Upload.
  - Record: start/pause/stop, elapsed timer, simple level indicator, file name suggestion, delete/retry.
  - Upload: accept .m4a/.mp3/.wav; drag/drop or file picker; show progress and size.
  - Constraints: max 60 minutes or 200 MB; enforce and message clearly.
  - On stop/upload complete: show asset card with name, duration/size, and “Send to Transcription”.

- Processing & Status
  - Status chips: Not Started, Awaiting Consent, Uploading, Transcribing, Summarizing, Ready for Review, Error.
  - Progress bar for long-running steps; in-app toast when ready.
  - If background processing, safe to leave; status persisted on return.

- Review & Approval (human-in-the-loop)
  - Tabs: Transcript | Summary | Action Items.
  - Transcript: redacted view by default; “Reveal PII” gated by role with audit banner.
  - Summary: bullet points; editable.
  - Action Items: checklist with title, owner (optional), due date (optional); editable.
  - Inline editing with autosave (local) until “Save Draft”; version badge (e.g., Draft v1).
  - Primary CTA: Approve & Publish (locks content, shows approver + timestamp).
  - Secondary: Request Reprocess (with reason) and Reject (requires reason).
  - Pre-approval banner: “Draft — not shared downstream.”

- Roles & Access
  - Contractor roles (sales/tech) can create, edit, approve.
  - Owner-operator can override and reveal PII.
  - Shareable read-only link (post-approval) for homeowners; transcript remains redacted.

- Error & Edge States
  - Handle mic permission denied, upload failures, size/time limits, processing errors with retry.
  - Offline banner; queue upload when back online (user-visible state).

- Responsive & Accessibility
  - Mobile-first; sticky bottom recording controls on mobile; two-column layout on desktop (tabs + content).
  - Keyboard navigable, focus management in dialogs, labels/ARIA on controls, 4.5:1 contrast.
  - Large touch targets (44px), safe areas respected.

## User Stories
- As a sales rep, I capture homeowner consent and record a meeting, then send audio to transcription.
- As a tech, I upload a pre-recorded call and later review the transcript and AI outputs.
- As a sales lead, I edit AI summaries/action items and approve them for publishing.
- As an owner, I reveal redacted PII when necessary and view the audit trail.
- As a homeowner, I view a read-only approved summary via a shared link.

## Technical Considerations
- Components: Stepper, Form (Zod-validated), AudioRecorder, FileUploader, StatusBadge, Tabs, Editor (plain text/textarea), Checklist items, Toasts, Confirmation modals.
- State model per meeting: consent {who, method, timestamp}, asset {id, name, duration, size}, status, artifacts {transcript, summary, actions, version}, approval {by, at}.
- Status updates via polling or SSE; must gracefully resume after reload.
- Redaction toggle should request-confirm and log event; default to redacted.
- Feature flag “meetingflow_mvp” guards entry points and subfeatures (verbal consent optionality).

## Success Criteria
- 90% of initiated meetings complete consent → capture → review flow without error.
- Median time from upload/stop to “Ready for Review” visibly tracked; 95% receive status updates within 2s of backend changes.
- <2% recording/upload failures; clear recoverability (retry success rate >90%).
- 95% of approvals lock artifacts and display approver/timestamp consistently.
- Accessibility: no critical WCAG 2.1 A/AA violations on audited screens.
- Performance: initial load LCP < 2.5s on mid-tier mobile; recording UI TTI < 2s.


