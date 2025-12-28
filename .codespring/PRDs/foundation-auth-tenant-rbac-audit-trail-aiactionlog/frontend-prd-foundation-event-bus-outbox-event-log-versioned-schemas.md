## Feature Overview
Provide an internal Event Console UI to observe the shared event bus: real-time event stream, immutable event log browser, outbox monitor, and canonical versioned schema catalog. The UI is read-only, filterable, and searchable with payload inspection, schema validation status, and consumer delivery visibility. This enables diagnosis, auditability, and confidence in the event-driven foundation without side effects.

## Requirements
- Navigation
  - Add "Event Console" to Admin navigation (hidden for non-admin roles).
  - Sub-sections: Stream, Event Log, Outbox, Schemas.
- Stream (near real-time)
  - Live view of most recent events with 5s polling (toggle pause).
  - Columns: Time, Tenant, Module, Event Type, Version, Correlation ID, Status (validated/invalid), Consumers (ack/failed count).
  - Filters: time window (last 5m/1h/24h/custom), tenant, module, event type, version, severity (info/warn/error), trace/correlation ID.
  - Row click opens Event Detail Drawer.
- Event Log (historical)
  - Cursor-based pagination; virtualized list for >10k items.
  - Full-text search across headers and payload (server-side), exact ID search.
  - Immutable indicator on records; export selected to JSON (client-side).
- Outbox
  - List unsent/sent/failed with columns: Created, Aggregate (entity), Destination, Attempts, Next Retry ETA, Error (last), Message ID.
  - Filters: status (pending/sent/failed), module, tenant, attempts range, destination.
  - Actions: copy message ID, view payload; no retry/resend actions in v1.
- Schemas (Versioned)
  - Catalog of canonical event types with latest version badge and stability (stable/experimental/deprecated).
  - Version selector; view JSON schema (read-only) and Zod example snippet.
  - Diff view between two versions (field adds/removals/changes).
  - Compatibility indicator: backward/forward flags derived from metadata.
- Event Detail Drawer
  - Header: Event Type@version, timestamp, tenant, module, environment.
  - Tabs:
    - Payload (pretty-printed JSON with redacted PII; copy/download).
    - Headers (IDs: event, correlation, causation, trace; partition; producer).
    - Validation (schema version used, valid/invalid, errors list).
    - Consumers (per-consumer delivery attempts, status, last error, idempotency key, last ack time).
    - Links: open related events by correlation/causation ID in new view.
- Access & Privacy
  - RBAC: only system-admin and engineer roles.
  - Redaction: PII fields masked by default; reveal requires elevated permission and is audited (modal confirm).
- States
  - Loading skeletons, empty, error (retry), paused stream state, no-permission state.
- Responsive & A11y
  - Mobile-first: collapsible filters, vertical list; drawer becomes full-screen sheet.
  - Keyboard navigable lists and tabs; semantic headings; high-contrast mode; copy buttons with ARIA labels.

## User Stories
- As a system admin, I can filter and search the event log to investigate a customer-reported issue and correlate events by correlation ID.
- As an engineer, I can inspect an outbox item's payload and last error to debug delivery failures without mutating state.
- As an auditor, I can confirm an event's schema version and validation status to verify compliance.

## Technical Considerations
- File paths (web)
  - apps/web/app/admin/events/page.tsx (section router)
  - apps/web/app/admin/events/stream/page.tsx
  - apps/web/app/admin/events/log/page.tsx
  - apps/web/app/admin/events/outbox/page.tsx
  - apps/web/app/admin/events/schemas/page.tsx
  - packages/ui/event-console/* (EventTable, Filters, DetailDrawer, SchemaViewer, JsonCodeBlock)
- Data contracts (read-only)
  - GET /api/events?query… returns {items[], nextCursor}
  - GET /api/outbox?query… returns {items[], nextCursor}
  - GET /api/schemas and /api/schemas/:type/:version
  - GET /api/events/:id
- Performance
  - Virtualized tables (>=10k rows), 5s polling; debounce filters (300ms).
  - Render payloads lazily; cap payload preview to 256KB with "load full" control.
- Observability
  - Show trace IDs; deep-link to tracing tool if available.
  - Instrument UI usage with PostHog; capture errors with Sentry (no PII).

## Success Criteria
- Event Stream updates within 5s; pause/resume works; no dropped UI updates during navigation.
- Event Log and Outbox lists load first page <1.5s p95; smooth scroll with virtualization.
- Filters and search return accurate results and preserve state via URL query params.
- Schema catalog displays versions with diff and compatibility badges; validation status visible on event details.
- RBAC enforced; PII redaction by default; reveal gated and audited.
- Zero mutating actions available; all exports and copies work reliably.

