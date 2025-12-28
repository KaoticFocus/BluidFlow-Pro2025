## Feature Overview
Enable contractors to draft structured RFQs to vendors/subs and ingest vendor quotes (email/upload) into normalized line items with lead times for comparison and approval.

## Requirements
- Create RFQs with line items, due dates, and terms; send to selected vendor contacts. Track recipient status (drafted, sent, opened, responded).
- Ingest vendor quotes via inbound email and file upload; persist the source document and message metadata.
- Parse quotes into normalized quote and quote_line records, including currency, unit pricing, extended totals, and per-line lead_time_days. Link lines to RFQ items when possible with confidence scores.
- Support manual review/edit after parsing; changes should not overwrite source document and must be auditable.
- Maintain multi-tenant isolation (org_id) and reference project_id for context.
- Emit domain events via existing outbox (not defined here): rfq.created, rfq.sent, quote.ingested, quote.parsed, quote.reviewed.

## User Stories
- Estimator drafts RFQ with 5 items and emails to 3 vendors; sees which vendors opened/responded.
- Vendor replies with PDF quote via email; system stores email, extracts data, and proposes parsed line items/lead times for review.
- Estimator edits 2 parsed lines (unit mismatch) and approves the quote for comparison.

## Technical Considerations
### Data Model & Schema Design
- RFQ core: rfq, rfq_recipient, rfq_item, rfq_message.
- Quote ingestion/parsing: ingested_document (source), inbound_email (metadata), quote, quote_line, quote_parse_run (AI audit).
- Relationships:
  - rfq 1–N rfq_item, rfq_recipient, rfq_message.
  - rfq_recipient N–1 vendor_contact (external table), optional via email.
  - quote 1–N quote_line; quote N–1 rfq and rfq_recipient.
  - ingested_document optionally links to rfq and/or quote.
  - inbound_email optionally links to rfq and recipient; attachments land in ingested_document.

### Indexes & Constraints
- Uniqueness:
  - rfq_recipient: (rfq_id, vendor_contact_id) unique where vendor_contact_id not null; (rfq_id, email) unique where email not null.
  - quote: unique (rfq_id, recipient_id, vendor_quote_number) to prevent duplicate uploads.
  - inbound_email: unique (message_id) to ensure idempotent ingest.
- Status enums (VARCHAR with CHECK):
  - rfq.status in [draft, scheduled, sending, sent, closed, canceled].
  - rfq_recipient.status in [drafted, sent, opened, responded, declined].
  - quote.parse_status in [pending, parsing, parsed, failed]; review_status in [needs_review, approved, rejected].
- Checks: quantities >= 0; prices >= 0; currency is 3-char upper-case; lead_time_days >= 0.
- Indexes (examples):
  - rfq(org_id, project_id, status, due_at), rfq_recipient(org_id, rfq_id, status), quote(org_id, rfq_id, received_at DESC), quote_line(org_id, quote_id, rfq_item_id), inbound_email(org_id, received_at DESC).
  - GIN on quote_line.extracted for flexible filters; optional pg_trgm on quote_line.description and sku for fuzzy match.

### Data Migration Strategy
- Forward-only migrations creating new tables and FKs. No destructive changes.
- Backfill: none required. If vendor_contact table exists, allow null vendor_contact_id and rely on email matching until contacts are normalized.
- Seed status values and CHECK constraints; default currency inferred from org settings where available.
- Add unique index on inbound_email.message_id with ON CONFLICT DO NOTHING in ingest path for idempotency.

### Query Optimization Considerations
- Primary flows: list open RFQs by project and due date; fetch latest quote per recipient; join quote_line to rfq_item for side-by-side comparisons.
- Use covering indexes on common filters/sorts (status, due_at, received_at). Keep quote_line numeric fields as NUMERIC to avoid casting in aggregates.
- Store extracted JSON in quote_line.extracted; use GIN indexes for ad-hoc filters. Denormalize extended_price to avoid runtime multiplication in comparisons.

## Success Criteria
- 90% of incoming quotes auto-parsed to line items without parser errors; median parse latency < 30s from receipt.
- >80% of parsed lines auto-mapped to RFQ items with confidence >= 0.8.
- RFQ send/open/response statuses visible within 2s of change; duplicate email ingests reduced to <0.5% via idempotency keys.
- All parses have an auditable quote_parse_run with model, timestamps, and errors when applicable.

