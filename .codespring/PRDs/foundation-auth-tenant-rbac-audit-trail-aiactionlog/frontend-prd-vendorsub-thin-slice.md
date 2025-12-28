# Vendor/Sub thin slice

## Feature Overview
Enable users to draft RFQs to vendors/subcontractors and convert received quotes into structured line items with lead times for comparison and scheduling. The flow is review-first: AI suggests content and parses quotes, but users must confirm before sending or committing data. Optimized for mobile and desktop.

## Requirements

### RFQ Drafting UI
- Entry points:
  - From Project > Materials/Scope list "Request Quotes" (preselects scope items).
  - Global + "New RFQ".
- Screen layout:
  - Header: "New RFQ", Project chip, RFQ ID (temporary), Status badge (Draft/Scheduled/Sent).
  - Recipients: multi-select of Vendors/Subs with chips, searchable; add ad-hoc email/name; validation for duplicates and domain format.
  - Due date: date/time picker; optional reminder toggle (24h before due).
  - Subject: templated with variables {project_name}, {scope_summary}; inline edit.
  - Message body: rich text editor with variables and placeholders; "Draft with AI" action that pulls selected scope/context; shows AI output with citations drawer; editable.
  - Attachments: select from Project Files and upload (PDF/JPG/PNG/CSV, max 25MB each); previews, remove.
  - Scope summary: read-only list of requested items (qty, unit, notes); toggle to include in email.
  - Delivery preview: email rendering with recipients and attachments; send test to self.
  - Actions: Save Draft, Schedule Send, Send Now (confirmation modal listing recipients, subject, attachments, PII warning).
- States: empty (no recipients), draft (unsent), scheduled, sending (spinner), sent (per recipient status: queued/sent/delivered/bounced), error (toast + inline reason).
- Autosave every 3s or on blur; offline banner with local cache and retry.

### Quote Intake & Parsing UI
- Upload sources:
  - Drag/drop or tap to upload quote files (PDF, image, CSV, EML) and email paste-in; one or multiple files per vendor.
  - From Email forward: paste raw email; strip signatures.
- Processing states: queued, OCR, parsed, needs review, approved, failed (retry).
- Review screen:
  - Vendor details: detected vendor name/logo/contact (editable); link or create Vendor record.
  - Parsed table of line items: columns [Description, SKU, Qty, Unit, Unit Price, Ext Price (calc), Lead Time, Notes]; inline editable cells.
  - Row actions: split/merge rows, delete, add.
  - Field confidence badges (High/Med/Low); low-confidence cells highlighted and must be confirmed before Approve.
  - Terms & conditions field (free text), Quote validity date, Shipping, Taxes, Payment terms.
  - Mapping: typeahead to map each line item to Catalog/Scope item (optional), with chips.
  - Attachments viewer with page thumbnails; click to jump to source text highlight.
  - Comparison view: select multiple quotes for same scope; side-by-side columns with best price/lead time highlights; choose "Preferred".
  - Actions: Save Draft, Approve (requires ≥1 line item and lead time present or explicit waiver), Reject (reason), Request Revision (opens compose modal to vendor).
- Export: on Approve, allow "Add to Project BOM" or "Hold for Schedule" toggles.

### Navigation & Routing (web)
- apps/web/app/projects/[projectId]/rfq/new
- apps/web/app/projects/[projectId]/quotes/upload
- apps/web/app/projects/[projectId]/quotes/[quoteId]/review
- Shared components in packages/ui/vendor-sub/*

### Accessibility & UX
- All controls labeled; ARIA for toasts/modals; table editable cells keyboard-navigable (Enter to edit, Esc to cancel, Tab to next).
- Color contrast AA; focus outlines visible.
- Mobile: single-column layout; sticky action bar; file picker integrates camera scan.

### RBAC
- Roles allowed: Owner, Sales/Estimator can draft/send/approve; Crew Lead can view; Client cannot access.
- Tenant scoping: only tenant's vendors/subs visible.

### Telemetry & Audit
- Track events: rfq_drafted, rfq_sent, quote_uploaded, quote_parsed, quote_approved, quote_rejected, quote_compared.
- Show "AI details" drawer (prompt, model, sources) with copy and citation links.
- Immutable activity log per RFQ/Quote.

## User Stories
- As an estimator, I draft an RFQ from selected scope, attach drawings, and schedule send with a due date.
- As an estimator, I upload a vendor's PDF quote and quickly confirm parsed line items and lead times.
- As an owner, I compare two vendor quotes side-by-side and mark one as preferred.

## Technical Considerations
- Use shadcn/ui: Combobox, DatePicker, Editor, DataTable with editable cells, Drawer, Toast.
- File uploads to R2 with presigned URLs; show per-file progress.
- AI actions must be review-first with visible citations; redact PII in previews where configured.
- Error handling: retries on upload/parse failures, clear recovery actions.

## Success Criteria
- 80% of RFQs sent within 3 minutes of starting draft (P75).
- 90% of quotes require ≤3 fields manual correction per document (P75).
- ≥70% of approved quotes mapped to at least one scope item.
- Zero RFQs sent without explicit confirmation.
- Telemetry coverage ≥95% for listed events; no accessibility violations at AA in automated scans.

