**Feature Overview**
Classify, OCR, and extract structured data from tenant-owned documents, enforcing review-first workflows and an immutable AI audit trail. Supports mobile and web uploads, email intake, and R2 storage, with dedupe, PII redaction, routing to document type schemas, and a needs-review queue.

**Requirements**
- Ingest documents (upload/email/import) with R2 pointers, content hash dedupe, and source attribution.
- OCR per page; store text, language, confidence; support re-runs and versioning.
- Auto classification to a tenant-scoped document type; apply routing rules; track confidence and overrides.
- Extraction to a typed schema (versioned) with per-field confidence, normalization, and bounding boxes.
- Needs-review queue with assignment, prioritization, approvals/rejections, and notes; no external side effects pre-approval.
- PII redaction policies and consent capture before OCR/embedding; store redacted previews.
- Embeddings for similarity search and RAG; scope to page/document/extraction.
- Immutable AI audit logs with model, prompt hash, token/cost accounting, and event versions.
- Event-driven outbox for downstream consumers; idempotent processing and retryable jobs.

**User Stories**
- As an estimator, I upload a photo/PDF; it's auto-classified and extracted, then appears in my needs-review queue with suggested fields.
- As an owner, I approve the extraction and link the document to a project and customer.
- As compliance, I see consent and redaction applied before embeddings are created.

**Technical Considerations**
- Multi-tenant: tenant_id on all primary aggregates; enforce RLS outside schema scope. All IDs are UUID. Timestamps are UTC.
- Storage: original and derivative objects in R2 (bucket/key/etag); hash-based dedupe per tenant.
- Versioning: doc types and extraction schema_version; extractions can supersede earlier runs.
- Events: immutable outbox with aggregate_id = document_id; versioned event_name; consumers idempotent via dedupe_key.

**Data Model & Relationships**
- ai_documents is the root aggregate.
- One-to-many: ai_documents → ai_document_pages, ai_extractions, ai_classifications, ai_reviews, ai_review_assignments, ai_embeddings, ai_pii_redactions, ai_ingest_errors, ai_processing_jobs, ai_audit_logs, ai_doc_links.
- ai_doc_types defines tenant-scoped classification/extraction targets.
- ai_extractions → ai_extracted_fields.

**Indexes & Constraints**
- ai_documents: unique(tenant_id, sha256_hash); idx on (tenant_id, status, priority, created_at desc); partial idx where status='needs_review'.
- ai_doc_types: unique(tenant_id, code, version); idx on (tenant_id, is_active).
- ai_extractions: idx (document_id, created_at desc), idx (status), fk to previous extraction.
- ai_extracted_fields: idx (extraction_id), idx (field_key), gin-like search handled at app or later migration.
- ai_embeddings: idx (document_id), idx (content_scope, scope_id), idx (model).
- Outbox: idx (tenant_id, processed_at nulls first), unique(dedupe_key) when provided.
- Check constraints (implemented via enums at app layer): statuses, event types, job types.

**Data Migration Strategies**
- Phase 1: create base tables; store embeddings as JSON text; backfill OCR text and classifications for existing docs.
- Phase 2: add pgvector column alongside embedding_json and backfill; keep dual write until cutover.
- Phase 3: enforce dedupe unique index; remediate collisions.
- Rolling migrations with event version bumps; outbox replay-safe.

**Query Optimization Considerations**
- Review queue: use composite index (tenant_id, status, priority desc, created_at desc) and assignment filters.
- Search: prefix indexes on field_key and created_at; consider materialized view for recent needs_review.
- Large TEXT fields (ocr/extraction) read-optimized via page-level fetch; avoid SELECT *.

**Success Criteria**
- 95% of documents reach needs-review within 30s P95; 99% audit log coverage of AI actions.
- Dedupe prevents >90% duplicate reprocessing within tenant.
- Zero embeddings generated without required consents; 100% review gate before external effects.
- <200ms P95 review-queue listing for tenants up to 50k docs.

