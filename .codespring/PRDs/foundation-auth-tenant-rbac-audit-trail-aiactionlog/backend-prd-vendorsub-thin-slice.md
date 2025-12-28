Feature Overview
RFQ drafting and vendor/subcontractor quote parsing thin slice to support: (1) AI-assisted RFQ draft generation from project scope and requested items, and (2) ingestion and AI parsing of vendor quotes into normalized line items and lead times with review-first approval before updating the project record.

Requirements
- RFQ Drafting
  - Create RFQ draft scoped to a project and vendor/sub.
  - Generate AI-drafted subject/body using project, item requests, and due-by date.
  - Persist draft with status lifecycle: draft → ready_for_send (manual review complete). Sending is out of scope.
- Quote Ingestion & Parsing
  - Ingest vendor quotes via file upload (PDF/image) or email forward (message_id), store raw artifacts, queue async parsing.
  - Parse into normalized line items (material/labor/equipment/sub), unit, qty, unit_price, total, currency, tax/shipping/fees, and lead times.
  - Surface confidence and extraction issues; require human review and approval; no updates to project until approved.
  - On approval, emit normalized quote events; associate to RFQ when available; do not commit purchase orders in this slice.

API Endpoints (Hono, JSON)
- POST /api/vendor-rfqs
  - Auth: tenant-scoped; Roles: estimator|owner (write)
  - Body: { projectId, vendorId, lineItemRequests:[{description, qty, unit, specs?, skuId?}], dueBy?, notes?, generateDraftContent?:boolean }
  - Resp: RFQ { id, status, subject?, body?, lineItemRequests[], dueBy?, auditIds }
  - Emits: rfq.drafted.v1
- GET /api/vendor-rfqs/:id
  - Auth: tenant-scoped; Roles: estimator|owner|field (read)
- PATCH /api/vendor-rfqs/:id
  - Body: partial updates { subject?, body?, lineItemRequests?, dueBy?, status? (only to ready_for_send) }
  - Emits: rfq.updated.v1
- POST /api/vendor-quotes/ingest
  - Auth: estimator|owner
  - Body: { projectId, vendorId, rfqId?, source: "upload"|"email", files?:[{key, bucket, mime, size}], emailMessageId? }
  - Resp: VendorQuote { id, status:"ingested", files[], source }
  - Side effects: enqueue parse job
  - Emits: quote.ingested.v1
- GET /api/vendor-quotes/:id
  - Returns raw + parsed (if available) with confidence and issues[]
- POST /api/vendor-quotes/:id/parse (manual re-parse)
  - Auth: estimator|owner; Enqueue parse job; Emits: quote.reparse_requested.v1
- POST /api/vendor-quotes/:id/approve
  - Body: { corrections?:{lines:[...] , summary?}, linkRfqId? }
  - Transitions status parsed|needs_review → approved; Emits: quote.approved.v1 with normalized payload
- POST /api/vendor-quotes/:id/reject
  - Body: { reason }
  - Emits: quote.rejected.v1

Parsing Output (normalized)
- quote: { currency, subtotal, tax, shipping, fees, total, validityDate?, terms?, leadTime:{type:"days"|"date"|"range", days?, minDays?, maxDays?, promisedDate?}, lines:[{ id, kind:"material"|"labor"|"equipment"|"sub", description, qty?, unit?, unitPrice?, total?, skuId?, leadTime? }], mapping:{ rfqRequestId? -> quoteLineId[] }, confidence:[0-1] }

Validation & Rules
- RFQ lineItemRequests require description (3-500 chars), qty > 0 when unitPrice expected; unit in enum ["ea","lf","sf","day","hr","lot"].
- Vendor/project/vendor-tenant ownership enforced.
- Quote totals must reconcile: sum(lines)+tax+shipping+fees ≈ total within 1% unless flagged in issues[].
- Lead time normalized to days when date provided (project timezone).

Security & Auth
- Better-auth, RBAC, tenant scoping on all reads/writes.
- R2 presigned PUT/GET; files virus-checked (stub ok); access only to tenant members.
- Idempotency-Key header supported on POST endpoints.
- AI prompts/outputs stored with redaction/citations; audit trail immutable; no external sends.

Technical Considerations
- Storage: Postgres (Prisma) tables: vendor_rfq, vendor_quote, vendor_quote_line, ai_audit, file_asset. pgvector optional for SKU matching.
- Jobs: BullMQ queues: rfq_draft_generate, quote_parse. Concurrency 5; timeout per job 60s; retry backoff.
- AI: OpenAI GPT-4o with JSON schema extraction; OCR via Document Intelligence pipeline; embeddings redacted.
- Events: Outbox pattern; versioned topics: rfq.drafted.v1, rfq.updated.v1, quote.ingested.v1, quote.parsed.v1, quote.needs_review.v1, quote.approved.v1, quote.rejected.v1.
- Observability: OTel traces per request/job; Sentry for errors; PostHog capture key actions.
- Performance: Uploads up to 25MB/file; parse SLA P50 12s, P95 25s; endpoints P95 < 300ms excluding parsing.

User Stories
- As an estimator, I create an RFQ draft for AC unit replacement with 3 line items and get an AI-drafted email ready for my edits.
- As an estimator, I upload a vendor PDF quote; the system parses prices and a 10–14 day lead time, I correct one line, approve, and the quote is linked to the RFQ.

Success Criteria
- 90% of RFQ drafts generated with no more than 1 manual edit to structure.
- 85% of quotes parse to balanced totals without manual corrections; average review time < 3 minutes.
- Zero unreviewed AI outputs cause project-side mutations.
- Events emitted for 100% of lifecycle transitions; no cross-tenant data leakage.
- P95 end-to-end ingest→parsed < 2 minutes for single 10-page PDF.

