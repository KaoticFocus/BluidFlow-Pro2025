# Foundation: Auth + Tenant + RBAC + Audit Trail (AIActionLog)

## Feature Overview
Provide multi-tenant authentication, tenant/org membership, role-based access control, session management, consent capture, and an immutable AIActionLog for every AI output/proposal. Enforce tenant isolation, review-first gating for AI actions, and append-only auditability with event emission.

## Requirements
- Authentication and Sessions
  - Email/password auth via Better-auth; rotate refresh tokens; HttpOnly cookies for web; Bearer tokens for mobile.
  - Session introspection with tenant context; support multi-tenant membership and tenant switching.
  - Rate limiting on auth endpoints; brute-force protection and device/session revocation.

- Tenant and Membership
  - Create tenant on first signup; user can belong to multiple tenants.
  - Membership status (active/invited/disabled); owner is created on tenant creation.
  - Tenant isolation required on all scoped endpoints via X-Tenant-ID and membership check.

- RBAC
  - Default roles per tenant: owner, admin, sales, field_tech, client.
  - Permissions namespace (e.g., ai.actions.create, ai.actions.approve, users.invite, projects.read/write).
  - Assign multiple roles per member; computed permission set = union of role permissions.
  - Authorization middleware checks permission + tenant membership on each request.

- Consent Capture
  - Record explicit consent for data processing, AI assistance, recording/transcription, and communications (email/SMS/calls).
  - Store subject, channel, language, policy text/version/hash, actor, timestamp, and evidences (ip, ua, media URL).
  - Queryable by subject and type; required before AI or comms actions.

- AIActionLog (Immutable)
  - Log every AI generation/proposal with full context: model, inputs, prompt hash, citations, redaction flags, output, token usage, planned side effects, requiresReview flag, traceId.
  - Append-only; decisions (approve/reject) are separate records referencing the original action.
  - No external side effects (email/SMS/file writes/3rd-party APIs) until approved by a user with ai.actions.approve.
  - Emit events for log created, decision made, and side-effect executed.

## API Endpoints (Hono, JSON)
- Auth
  - POST /auth/signup {email, password, tenantName} -> {user, tenant, session}
  - POST /auth/signin {email, password} -> {session}
  - POST /auth/signout -> 204
  - POST /auth/refresh -> {session}
  - GET /auth/session -> {user, memberships, activeTenant}

- Tenants & Membership
  - POST /tenants/invite {email, roleIds[]} [X-Tenant-ID] -> {inviteId}
  - POST /tenants/accept-invite {token, password?} -> {membership}
  - POST /tenants/switch {tenantId} -> {activeTenant}
  - GET /tenants/members [X-Tenant-ID] -> {members[]}

- RBAC
  - GET /rbac/roles [X-Tenant-ID] -> {roles[], permissions[]}
  - POST /rbac/assign {userId, roleIds[]} [X-Tenant-ID] -> 204
  - GET /rbac/permissions [X-Tenant-ID] -> {permissions[]}

- Consents
  - POST /consents [X-Tenant-ID] {subjectType, subjectId, consentType, channel, policyHash, textVersion, language, evidence?} -> {consentId}
  - GET /consents [X-Tenant-ID] ?subjectType&subjectId&consentType -> {consents[]}

- AIActionLog
  - POST /ai/actions [X-Tenant-ID] {actor, model, promptHash, inputRefs[], inputRedacted, output, citations[], tokenUsage, requiresReview, plannedSideEffects[], piiDetected, redactionSummary?} -> {actionId}
  - GET /ai/actions [X-Tenant-ID] ?status&createdFrom&createdTo&actor -> {actions[]}
  - GET /ai/actions/:id [X-Tenant-ID] -> {action}
  - POST /ai/actions/:id/decision [X-Tenant-ID] {decision: approve|reject, reason?} -> {decisionId}
  - Webhooks/events publish: ai.action.logged.v1, ai.action.approved.v1, ai.action.rejected.v1, ai.action.executed.v1

## Data Model (Prisma, summary)
- Tenant(id, name, plan, createdByUserId, createdAt)
- User(id, email, name, status, createdAt)
- Membership(userId, tenantId, status)
- Role(id, tenantId|null, name, permissions[])
- UserRole(membershipId, roleId)
- Consent(id, tenantId, subjectType, subjectId, consentType, channel, policyHash, textVersion, language, actorUserId, evidence, createdAt)
- AIActionLog(id ULID, tenantId, actorUserId|null, actorService, model, promptHash, inputRefs JSONB, output TEXT, citations JSONB, tokenUsage JSONB, requiresReview, plannedSideEffects JSONB, piiDetected, redactionSummary, status ENUM(proposed|approved|rejected|executed), traceId, contentHash, createdAt, embedding VECTOR)
- AIActionDecision(id, actionId, decidedByUserId, decision ENUM(approve|reject), reason, createdAt)
- Outbox(id, eventType, payload JSONB, tenantId, occurredAt, processedAt?)

Constraints: forbid UPDATE/DELETE on AIActionLog, AIActionDecision; enforce status transitions via decisions only; indexes on (tenantId, createdAt), (promptHash), GIN for JSONB, HNSW for embedding.

## Technical Considerations
- Validation: Zod schemas shared in packages/shared and packages/events (versioned).
- Security: HttpOnly SameSite=Lax cookies; Bearer for mobile; per-tenant rate limits; Sentry and OpenTelemetry traceId propagation into AIActionLog.
- Redaction: all AI inputs/outputs pass through packages/ai redaction; store redactionSummary and piiDetected.
- Side effects: BullMQ jobs enqueued only after approval; jobs include actionId and immutable snapshot hash.
- File locations (guidance):
  - apps/api/src/routes/{auth,tenants,rbac,consents,ai}.ts
  - packages/db/prisma/schema.prisma
  - packages/events/src/schemas/aiActionLog.v1.ts

## User Stories
- As Owner, I create a tenant, invite users, and assign roles with least privilege.
- As Sales, I can request AI to draft a proposal; it’s logged and awaits approval.
- As Admin, I approve AI actions and the system executes side effects and records the decision.

## Success Criteria
- 100% of AI outputs/proposals create AIActionLog records with traceId and tenantId.
- No external side effects occur without an approved decision by a permitted user.
- Tenant isolation verified by tests; cross-tenant access attempts are denied.
- RBAC correctly enforces permissions for invite, assign, and AI approvals.
- Consent must exist for the relevant subject/channel before AI/comms actions proceed.
- Events emitted for all AI action lifecycle changes; outbox delivers reliably.


