# CORE AI: Document Intelligence

## Feature Overview
Backend service to ingest documents (PDF/images/audio), classify type, OCR/extract structured fields, and route results to a needs-review queue before any downstream effects. Provides tenant-safe storage, dedupe, RBAC access, AI audit trail, and event emissions for event-driven consumers.

## Requirements

- Functional
  - Accept uploads (PDF, JPG/PNG/HEIC, TIFF, email EML/MSG, audio M4A/MP3/WAV).
  - Compute SHA256 to dedupe per tenant; link duplicates instead of reprocessing.
  - Convert images to PDF, generate thumbnails, extract text (OCR) and embeddings.
  - Classify document type (e.g., invoice, receipt, proposal, contract, change_order, permit, inspection_report, scope_of_work, timesheet, warranty, lien_waiver, photo, other).
  - Extract structured fields per type using versioned JSON schemas; include page/coordinate citations.
  - Default review-first: all extractions create a review task; auto-approve only if tenant explicitly configures and confidence >= threshold.
  - PII detection and redaction for embeddings/logs; raw artifacts stored encrypted in R2.
  - RBAC: tenant-scoped; only roles with documents:read/approve/manage can access or approve.
  - Immutable AI audit trail (inputs/outputs hashed with pointers to artifacts).
  - Emit versioned domain events; no side effects to other modules prior to approval.

- API (Hono, JSON; all endpoints require auth, tenant scoped)
  - POST /v1/documents/uploads/init
    - body: { filename, contentType, sizeBytes, sha256, source? }
    - 201 -> { uploadId, r2PresignedPost, documentId }
  - POST /v1/documents/uploads/complete
    - body: { uploadId, r2Key, sha256 }
    - 202 -> { documentId, status: "processing" } (enqueues processing)
  - GET /v1/documents/:id
    - -> { document, latestExtraction, reviewTask?, presignedDownloadUrl? }
  - POST /v1/documents/:id/reprocess
    - -> 202; idempotent; re-enqueue pipeline.
  - POST /v1/documents/:id/links
    - body: { linkType: "project"|"customer"|"vendor", linkId }
    - -> 204
  - GET /v1/review-queue?status=queued|claimed&limit&cursor
    - -> { items: [ { task, document, previewUrl } ], nextCursor? }
  - POST /v1/review-queue/:taskId/claim
    - -> 200 { task }
  - POST /v1/review-queue/:taskId/approve
    - body: { corrections? (partial structured_fields), notes? }
    - -> 200; emits DocumentApproved.v1
  - POST /v1/review-queue/:taskId/reject
    - body: { reason, correctedType?, notes? }
    - -> 200; emits DocumentRejected.v1
  - GET /v1/documents/search?q&types[]&linkedTo&limit&cursor
    - -> full-text + vector hybrid results (RBAC-filtered)

- Events (outbox, immutable, versioned)
  - DocumentUploaded.v1, DocumentProcessed.v1, DocumentClassified.v1, DocumentExtracted.v1, DocumentNeedsReview.v1, DocumentApproved.v1, DocumentRejected.v1, DocumentDeduplicated.v1
  - Common fields: { eventId, occurredAt, tenantId, documentId, version, actor?, traceId }

- Data Model (Prisma)
  - Document: id, tenantId, r2Key, sha256, contentType, sizeBytes, status(enum), pageCount, language, createdBy, source(jsonb), softDeletedAt
  - DocumentVersion: id, documentId, r2OcrKey, r2PdfKey, r2ThumbKey, model, promptVersion, createdAt
  - DocumentInsight: id, documentId, type(enum), classificationConfidence, structuredFields(jsonb), fieldsSchemaVersion, piiDetected(bool), citations(jsonb), embedding(vector), createdAt
  - ReviewTask: id, documentId, status(enum queued|claimed|approved|rejected), reason, confidence, assignedTo?, notes, createdAt, decidedAt
  - AuditEvent: id, tenantId, documentId, action, actorId?, aiModel, inputHash, outputHash, meta(jsonb), createdAt
  - DocumentLink: id, documentId, linkType, linkId

- Processing workflow (BullMQ jobs; idempotent by tenantId+sha256)
  - doc.process -> normalize -> OCR (GPT‑4o Vision) / Whisper (audio) -> classify -> extract -> embed (pgvector) -> enqueue review -> emit events.

- Validation
  - Max size 40MB (configurable); allowed MIME whitelist; reject encrypted PDFs.
  - Confidence is 0..1; needs-review if any critical field missing or confidence < threshold.
  - All corrections update DocumentInsight (verified flag) and bump fieldsSchemaVersion.

## User Stories
- As a field tech, I upload a photo of a permit; the system classifies "permit," extracts permit number/authority, and queues it for my manager to approve.
- As an estimator, I upload a vendor invoice; on approval, downstream consumers can reconcile costs against the project.

## Technical Considerations
- Storage: Cloudflare R2 with presigned POST/GET; server-side encryption; keys namespaced by tenantId/documentId/.
- AI: OpenAI GPT‑4o for vision OCR/classify/extract; Whisper for audio; redact before embeddings; store prompts/model IDs in AuditEvent.
- Performance: P50 end-to-end processing ≤12s for 5-page PDFs, P95 ≤30s; queue concurrency per worker configurable; backoff with DLQ.
- Security: Better-auth JWT; RBAC checks; signed URLs time-limited; no raw PII in logs; Sentry scrubbers; OTel traces on each job step.
- Config: Tenant-level thresholds and auto-approve flag via Flagsmith.
- File paths (proposed):
  - apps/api/src/routes/documents.ts, routes/review-queue.ts
  - apps/api/src/jobs/document/*.ts (process, ocr, classify, extract, embed)
  - packages/events/src/schemas/document/*.ts
  - packages/ai/src/document-intel/*.ts (prompts, parsers, redaction)
  - packages/db/prisma/schema.prisma (tables above)
  - packages/shared/src/types/document.ts

## Success Criteria
- ≥95% correct classification on approved items; extraction F1 ≥0.9 for invoices/permits.
- ≥99% dedupe accuracy (no duplicate processing for identical files per tenant).
- P95 time from upload complete to review task ≤30s for ≤10 pages.
- Zero PII in logs or analytics; 100% AI actions recorded in audit trail.
- Event delivery exactly-once to outbox; no downstream side effects before approval by default.

