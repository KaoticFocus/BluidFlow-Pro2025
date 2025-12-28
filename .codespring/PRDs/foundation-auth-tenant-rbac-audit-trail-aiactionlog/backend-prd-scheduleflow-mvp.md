# ScheduleFlow MVP — Backend PRD

## Feature Overview
Create baseline project schedules with versioned drafts, track and surface constraint violations, and generate approval-gated notification drafts to crews and clients. No external side effects occur without explicit approval. All operations are multi-tenant, event-driven, audit-logged, and RBAC-enforced.

## Requirements
- Baseline schedule generation
  - Input: projectId or dateRange; optional preferences (workHours, bufferMinutes, allowOverlap=false, prioritize=earliestDueDate|highestValue).
  - Output: schedule version in draft status with scheduleItems and computed constraints.
  - Single active version per project; drafts do not replace actives until approved.
- Constraint tracker
  - Detect and persist constraints at schedule and item level on creation/update.
  - Blocking vs warning severity; types: ResourceDoubleBooked, ResourceUnavailable, OutsideWorkHours, DependencyViolation, OverlapWithHold, MissingClientSMSConsent, MissingClientEmail.
  - Summary counts returned on reads; details persisted as snapshots.
- Approval workflow
  - Schedule approval: transitions draft -> approved; archives previous active version for the same project; immutable audit trail.
  - Reject returns draft to rejected with reason.
  - Only roles owner|scheduler may approve schedules.
- Draft notifications (approval-gated)
  - Create notification drafts (email/SMS) for impacted parties (crew leads/employees, client) summarizing schedule/changes.
  - Require explicit approval to send; only owner can approve external sends by default (configurable RBAC).
  - Enforce channel consent (SMS) and PII redaction policies; violations recorded as constraints.
- Idempotency and concurrency
  - Idempotency-Key header on all POSTs; optimistic concurrency on schedule versions.
- Timezone handling
  - All datetimes stored in UTC; user-facing tz via Contractor Profile; validation uses contractor tz.
- Events (outbox)
  - schedule.draft.created.v1, schedule.constraints.updated.v1, schedule.approval.requested.v1, schedule.approved.v1, schedule.rejected.v1, schedule.notifications.draft.created.v1, notification.approval.requested.v1, notification.sent.v1.

## User Stories
- As a scheduler, I generate a draft schedule for a project and immediately see conflicts to resolve before requesting approval.
- As an owner, I review a draft schedule, approve it to make it active, and then approve notification drafts to inform crew and clients.
- As a crew lead, I receive approved notifications only after the schedule is approved, with accurate times in my timezone.

## Technical Considerations
- API (Hono, JSON, Zod-validated, tenant-scoped)
  - POST /api/schedule/v1/generate
    - body: { projectId?: string; dateRange?: {start:string; end:string}; preferences?: {workHours?: {start:string; end:string}; bufferMinutes?: number; allowOverlap?: boolean; prioritize?: string} }
    - headers: Idempotency-Key
    - returns: { schedule: Schedule; constraintsSummary: {blocking:number; warnings:number} }
  - GET /api/schedule/v1/schedules/:id
    - returns schedule, items, constraintsSummary, status.
  - POST /api/schedule/v1/schedules/:id/validate
    - re-computes constraints; returns full list.
  - POST /api/schedule/v1/schedules/:id/request-approval
  - POST /api/schedule/v1/schedules/:id/approve
  - POST /api/schedule/v1/schedules/:id/reject { reason: string }
  - POST /api/schedule/v1/schedules/:id/notification-drafts
    - creates or upserts drafts for crew/client; returns drafts list.
  - POST /api/schedule/v1/notification-drafts/:id/request-approval
  - POST /api/schedule/v1/notification-drafts/:id/approve
- Data model (Prisma, Postgres)
  - Schedule: id, tenantId, projectId, version, status: draft|pending_approval|approved|rejected|archived, tz, createdById, approvedById?, approvedAt?, meta(jsonb).
  - ScheduleItem: id, scheduleId, taskId, resourceIds(jsonb), startAt, endAt, location?, notes?, dependencyIds(jsonb).
  - ScheduleConstraint: id, scheduleId, scheduleItemId?, type(enum), severity(enum), message, blocking(bool), meta(jsonb), createdAt.
  - NotificationDraft: id, tenantId, scheduleId, channel: email|sms, to(jsonb), subject?, body, status: draft|pending_approval|approved|sent|canceled, externalMessageId?, approvals(jsonb).
  - AuditEvent (existing): append all state changes with actorId and before/after.
- Business logic
  - Generation pulls tasks from TaskFlow/Project modules; applies work hours and buffers; heuristic: earliest due date, first-fit non-overlap; mark conflicts rather than failing.
  - Approval sets schedule as active for project; archive prior active.
  - Notifications cannot be approved if schedule not approved; consent checks required for SMS.
- Security/RBAC
  - Better-auth JWT; enforce tenant and role: scheduler (generate/validate/request), owner (approve/reject/send).
  - PII redaction in stored notification bodies per policy.
- Jobs/queues
  - BullMQ jobs: schedule.generate (for >200 tasks), notification.send (Resend/Twilio), event.dispatch (outbox).
- Performance
  - Generate <=200 items sync (<2s p95); larger async job with progress.
  - Indexes: schedule(projectId,status), scheduleitem(scheduleId,startAt), constraint(scheduleId,blocking).
- Observability
  - OpenTelemetry traces per request/job; Sentry for errors; PostHog events on approvals.

## Success Criteria
- 95% of schedules with ≤200 tasks generated in <2s; constraints computed on creation.
- Zero external emails/SMS sent without explicit approval.
- Accurate multi-tenant scoping and RBAC on all endpoints (no cross-tenant access).
- All state transitions and sends present in audit trail and emitted as events.
- p95 notification send latency <10s post-approval; delivery status recorded.

