## Feature Overview
ScheduleFlow MVP provides baseline schedule generation, a constraint tracker to flag conflicts, and approval-gated draft notifications. It supports multi-tenant scheduling across projects, resources, and time windows with immutable auditability and event alignment.

## Requirements
- Create schedule plans with draft/published states and versioning.
- Store schedule entries (assignments) with time windows and resource links.
- Persist baseline generation runs with input snapshots and metrics.
- Define reusable constraints and record violations per plan/entry.
- Generate notification drafts (email/SMS/push/webhook) requiring approval before send.
- Support multi-tenant isolation, RBAC fields (created_by/approved_by), and audit events.

## Data Model and Schema Design
- Entities: schedule_plans (header), schedule_entries (assignments), schedule_generation_runs (baseline runs), constraint_definitions, constraint_violations, notification_drafts, approval_requests, schedule_audit_events.
- Relationships:
  - schedule_plans 1—N schedule_entries
  - schedule_plans 1—N constraint_violations
  - schedule_plans 1—N notification_drafts
  - schedule_generation_runs optionally linked to schedule_plans
  - approval_requests targets schedule_plans or notification_drafts
- External references (project_id, resource_id, etc.) are soft UUIDs to adjacent modules.

## Table Structures and Relationships
- schedule_plans: versioned plan container with status (draft/published/archived), validity window, and approval metadata.
- schedule_entries: atomic assignments with resource, project/task references, and time bounds; lock flag for protected entries.
- schedule_generation_runs: input_snapshot (JSONB), algorithm_version, status, metrics, timings.
- constraint_definitions: typed, parameterized constraints (JSONB params) scoped to global/project/resource/location; severity and active flags.
- constraint_violations: detected conflicts per plan/entry with lifecycle (open/waived/resolved).
- notification_drafts: approval-gated outbound messages with recipients, channel, send status, and linkage to approval_requests.
- approval_requests: generic approval workflow for plans and notifications.
- schedule_audit_events: immutable audit with diffs and correlation_id.

## Indexes and Constraints
- All tables include tenant_id and timestamps.
- schedule_plans: unique (tenant_id, id); index (tenant_id, status, valid_from, valid_to); optimistic lock via version (app-enforced).
- schedule_entries: indexes (tenant_id, plan_id), (tenant_id, resource_type, resource_id, start_at), (tenant_id, project_id, start_at). Application enforces non-overlap using indexed range queries.
- constraint_violations: index (tenant_id, plan_id, status), (tenant_id, entry_id).
- notification_drafts: index (tenant_id, plan_id, approval_status, send_status).
- approval_requests: index (tenant_id, target_type, target_id, state).
- CHECK constraints for enums (status/state/severity/channel/type).
- FKs: internal (entries.plan_id → plans.id; violations.plan_id → plans.id; violations.constraint_id → definitions.id; drafts.plan_id → plans.id; drafts.approval_request_id → approval_requests.id). External UUIDs are not FK-constrained.

## Data Migration Strategies
1) Phase 1: Create new tables with nullable links; deploy without traffic. 2) Phase 2: Backfill initial draft schedule_plans per tenant as empty; record migration actions in schedule_audit_events. 3) Phase 3: Enable writers; keep dual-write to schedule_audit_events. No destructive changes; future migrations must be additive and versioned.

## Query Optimization Considerations
- Primary read paths: active published plan for date range; resource-centric daily/weekly views; project-centric schedule; open violations; pending approvals.
- Use covering composite indexes listed above; limit JSONB filters to indexed columns; paginate by start_at + id for stability.
- Batch insert entries from generation runs; wrap approvals and publish in transactions.

## User Stories
- As a scheduler, I generate a baseline plan, review violations, and request approval to publish.
- As an approver, I approve a plan and related notifications; no messages are sent until approval.
- As a crew lead, I view my upcoming assignments from the published plan.

## Technical Considerations
- Write domain events to the shared event outbox on plan_published, entries_changed, violations_updated, notification_approved/sent.
- Enforce tenant scoping at query level; redact PII in notification bodies for audit. All state changes recorded in schedule_audit_events.

## Success Criteria
- 95% of plans publish without DB constraint errors; zero notifications sent without approved state.
- Constraint detection completes <2s for 1k entries; core read queries P95 <200ms.
- All publish/notify actions produce audit records and outbox events.

