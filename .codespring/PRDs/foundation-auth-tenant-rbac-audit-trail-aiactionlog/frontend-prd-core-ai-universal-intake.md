# CORE AI: Universal Intake

## Feature Overview
Universal Intake lets users capture inbound information (voice, text, photos, email) and convert it into a structured draft record with deduplication and a confirm-before-create review step. The UI centralizes intake items, displays AI-extracted fields with confidence and citations, flags potential duplicates, and requires explicit human approval before creating or linking records.

## Requirements
- Intake entry points (web + mobile):
  - Record voice (mic permissions, waveform, pause/resume, playback).
  - Text entry/paste (auto-detect phone/email/address).
  - Photo/document upload (camera, file picker; multiple attachments).
  - Email forwarding alias instructions with "Copy alias" + sample template.
- Intake Inbox:
  - List of Intake Drafts with filters: All, New, Processing, Needs Review, Conflicts, Ready, Approved, Rejected.
  - Columns/cards: source channels (icons), created time, summary, status pill, assignee, confidence badge (overall).
  - Search by contact, phone, email, address, subject.
- Intake Detail (desktop: 3-pane; mobile: tabbed):
  - Left: Sources & media
    - Audio player with transcription timeline; click text to seek; playback speed; download.
    - Image/PDF viewer; selectable OCR text panel with copy; page thumbnails.
    - Original email viewer (headers, body, attachments).
  - Middle: Extracted data form
    - Sections: Contact, Location, Project Type, Description/Notes, Priority, Channel, Tags.
    - Field chips with AI confidence (high/med/low) and inline edit.
    - Citation popovers showing source snippet; redacted view toggle.
    - Validation (phone/email formats, required minimum fields).
    - "Re-run extraction" and "Accept all suggested fields" actions.
  - Right: Dedupe & linking
    - Potential matches list (Customers, Projects, Leads) with match score, key fields preview.
    - Actions per match: Link, View, Dismiss. Select exactly one or choose "Create new".
    - Conflict banner if extracted fields contradict chosen match; prompt to resolve.
- Confirm-before-create:
  - Disabled until: required fields valid AND dedupe decision made.
  - Review summary modal: actions to be taken (Create Lead, Link to Customer X, attach media count), side effects list (no external sends).
  - Explicit confirmation checkbox: "I have reviewed and approve."
  - Success screen with links to created/updated records.
- States & feedback:
  - Status progress: New → Processing (transcribe/extract) → Needs Review → Ready → Approved/Rejected.
  - Inline spinners for background tasks; toast notifications on failures; retry controls.
  - Empty state with guidance and quick actions (Record, Upload, Paste Email).
- Accessibility:
  - Full keyboard navigation; ARIA labels for confidence, status, and source type.
  - Transcriptions and captions for audio; alt text prompts for images.
  - High-contrast mode support; avoid color-only indicators; motion reduced when prefers-reduced-motion.
- Responsive:
  - Mobile: sticky action bar (Approve/Reject), collapsible sections, large tap targets.
  - Desktop: resizable panes with remembered layout; table and card view toggle.

## User Stories
- As an estimator, I upload photos and a voicemail, review the extracted contact and project details, link to an existing customer, and approve creation of a new lead.
- As a field tech, I record a quick note on mobile, see transcription, fix the address, and approve to add to today's project.
- As an owner, I scan the intake inbox, filter for Conflicts, resolve duplicates, and approve in bulk.
- As a CS rep, I paste an email thread, verify parsed contact info, dismiss wrong matches, and create a new customer.

## Technical Considerations
- Component architecture (web):
  - apps/web/app/intake/page.tsx (Inbox)
  - apps/web/app/intake/[id]/page.tsx (Detail)
  - packages/ui/intake/
    - IntakeQueueList.tsx, IntakeFilters.tsx
    - IntakeDetail.tsx
    - SourceViewer/{AudioPlayer.tsx, ImagePdfViewer.tsx, EmailViewer.tsx, OcrPanel.tsx}
    - ExtractedForm/{Field.tsx, ConfidenceBadge.tsx, CitationPopover.tsx, RedactionToggle.tsx}
    - DedupeMatches.tsx, ConflictBanner.tsx
    - ApprovalBar.tsx, ReviewSummaryModal.tsx, AuditTrailDrawer.tsx
- Mobile (Expo): apps/mobile/src/screens/IntakeInbox.tsx, IntakeDetail.tsx with bottom sheets for media and approval.
- Data contracts (UI expectations):
  - GET /intake (filters, pagination), GET /intake/:id, PATCH /intake/:id (edits, decisions), POST /intake/:id/approve, POST /intake/:id/reject.
  - SSE/WebSocket events: intake.updated, intake.processing, intake.failed for real-time updates.
- RBAC: View vs Approve separated; disable actions and show reason when lacking permission.
- Telemetry: PostHog events for key actions; Sentry error capture on media/transcription failures.
- Feature flags (Flagsmith): enable-voice, enable-email, show-citations.
- Privacy: Default redacted view for PII; "Reveal once" requires confirmation.

## Success Criteria
- ≥80% of new intakes approved without leaving the detail view.
- ≥60% of intakes linked to an existing entity when one exists (dedupe precision).
- Median time from intake open to approval ≤90 seconds.
- <2% client-side error rate on media upload/transcription display.
- Accessibility: passes WCAG AA for contrast and keyboard operability; all audio has transcripts.

