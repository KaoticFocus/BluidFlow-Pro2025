# CORE AI: Document Intelligence

## Feature Overview
Human-in-the-loop UI to review AI-processed documents: classify, OCR, extract fields, dedupe/link to existing records, and approve into the system of record. Central "Needs Review" queue with bulk actions, detailed review panel, and field-level confidence/citations.

## Requirements
- Entry points
  - New items arrive from intake/upload/email and land in Needs Review.
  - Access controlled by RBAC (Roles: Owner, Estimator, Crew Lead; read-only for Homeowner).
- Needs Review Queue (web + mobile)
  - List/grid toggle; infinite scroll; server-side filters: status (Unreviewed, Changes Requested, Approved), document type (AI guess), source (Upload/Email/Scan/Rag), module (Customer/Project/Vendor), assignee, confidence bands, date, tags.
  - Search across filename, OCR text, extracted fields.
  - Cards show thumbnail, AI type guess, confidence %, source icon, assignee, arrival time, dedupe flag.
  - Bulk select with actions: Assign, Approve, Request Changes, Re-run OCR, Delete, Tag.
  - Empty state with drag-drop upload (web) and camera/upload CTA (mobile).
- Document Review Detail
  - Layout: document viewer with text overlay + thumbnails; right-side review panel (mobile collapsible bottom sheet).
  - Classification
    - AI-suggested type with confidence; dropdown to change; required fields schema loaded per type.
    - Status chip and timeline: Ingested → OCR → Extracted → Reviewed → Approved.
  - OCR/Text
    - Toggle: Text overlay on document; selectable words; clicking a field focus highlights bounding boxes on page.
    - Page tools: rotate, reorder, split/merge pages; re-run OCR.
  - Extraction Form
    - Dynamic fields per type with AI-filled values, per-field confidence, and "from" citation (page x, bbox).
    - Actions per field: accept, edit, clear, mark as not present.
    - PII redaction preview toggle (blur boxes); "Mark as PII" checkbox per field; redaction applied in previews by default for non-admin roles.
  - Linking & Dedupe
    - Suggested links (e.g., Customer, Project, Vendor) with matches and confidence; quick-link to existing records; create-new gated behind confirm-before-create.
    - Conflict banner when potential duplicate detected with side-by-side diff; choose Link, Keep Separate, or Merge (metadata only).
  - Comments & Assignment
    - Inline comments with @mention; assign reviewer; due date.
  - Actions
    - Approve (enabled only when required fields valid and at least one linked entity chosen when schema requires).
    - Request Changes (requires note).
    - Save Draft, Discard, Delete (soft delete).
    - Export PDF (redacted/unredacted toggle).
- Notifications & Feedback
  - Toasts for saved/approved/errors; progress bar for long OCR.
  - Badge counts per filter; real-time updates via event stream.
- Responsive & Mobile
  - Mobile single-column flow: top toolbar (Back, Assign, Approve), swipe between pages; bottom drawer for fields.
  - Camera capture with doc edge auto-crop hint; offline-safe draft until uploaded.
- Accessibility
  - Full keyboard navigation; ARIA roles for list, viewer, and form fields.
  - 4.5:1 contrast minimum; focus traps in modals; text scaling to 200%.
  - Screen-reader labels include field name, value, confidence, and citation location.

## Component Architecture (web)
- apps/web/app/(tenant)/documents/review/page.tsx – Needs Review queue
- apps/web/app/(tenant)/documents/[docId]/page.tsx – Detail review
- packages/ui/document/DocumentCard.tsx
- packages/ui/document/DocumentList.tsx
- packages/ui/document/DocumentViewer.tsx (thumbnails, page tools, text overlay)
- packages/ui/document/ExtractionForm.tsx
- packages/ui/document/DedupePanel.tsx
- packages/ui/document/RedactionToggle.tsx
- packages/ui/document/ActionBar.tsx
- packages/ui/document/CommentsAssign.tsx

Mobile (Expo):
- apps/mobile/screens/DocumentsQueueScreen.tsx
- apps/mobile/screens/DocumentReviewScreen.tsx
- apps/mobile/components/DocumentViewer.tsx
- apps/mobile/components/ExtractionForm.tsx

## User Stories
- As an estimator, I can bulk-approve receipts with high confidence after spot-checking key fields.
- As a crew lead, I can capture a signed work order on mobile and verify extracted totals before approval.
- As an owner, I can link an invoice to an existing project when a duplicate is detected.

## Technical Considerations
- Use Tailwind + Shadcn UI; prefer server components for lists, client for viewer/interactions.
- Render PDFs/images via canvas with selectable text overlay; lazy-load pages and thumbnails.
- Persist draft edits immediately; autosave every 5s; optimistic UI with retry-safe toasts.
- Feature flags: flagsmith key document_viewer_v2.
- Telemetry: PostHog events (doc_queue_view, doc_open, field_accept, field_edit, approve_click, approve_success, rerun_ocr).
- Error states: corrupted file, OCR failed, schema unavailable; provide retry and support link.
- Internationalization for dates/currency fields only.

## Success Criteria
- 95% of documents reviewable on mobile without desktop fallback.
- Median time from open to approve < 60s for high-confidence docs.
- < 2% user-reported extraction errors post-approval.
- Accessibility: WCAG 2.1 AA checks pass, keyboard-only review possible.
- Performance: first contentful viewer paint < 2s on 4G; page memory stable when reviewing 20+ page PDFs.

