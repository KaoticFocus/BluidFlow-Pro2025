## Feature Overview
Multi-tenant authentication and RBAC foundation enabling isolated organizations (tenants), user membership and roles, session management, consent capture, and an immutable AIActionLog recording every AI proposal/output with review-first gating. This schema is the security backbone for all modules and AI services and enforces least-privilege access with comprehensive traceability.

## Requirements
- Tenancy: isolate data by tenant_id; users can belong to multiple tenants via memberships.
- Auth: users with email-first identity, optional provider linkage; session records with active tenant context.
- RBAC: hierarchical roles per tenant mapped to global permissions; optional per-user overrides; platform admin flag for cross-tenant ops.
- Invitations: invite by email with role assignment and expiry.
- Consent: capture immutable consent events (purpose, channel, version, document link) with revocation history.
- AIActionLog: append-only audit log for any AI action including inputs (redacted), outputs, citations, costs, tool calls, and review status via separate review records; support dedupe and side-effect proposals.
- Immutability: prohibit UPDATE/DELETE on ai_action_log; approvals/rejections captured in ai_action_review; executions in ai_action_side_effect.
- PII/Redaction: store redaction metadata and redacted prompt; never store raw PII beyond allowed consent scope.

## Data Model & Schema
- Users 1..N Tenants via tenant_memberships; membership -> role; role -> permissions; optional permission_overrides per membership.
- Sessions bound to user with optional active_tenant_id.
- Consents scoped by tenant and subject; latest effective state determined by granted/revoked timestamps.
- AIActionLog references tenant, optional actor_user, optional related entity (input_ref_table/id). Reviews and side-effects reference the log.

## Table Relationships & Constraints
- users(id) <- tenant_memberships.user_id (FK)
- tenants(id) <- tenant_memberships.tenant_id (FK)
- roles(tenant_id,id) <- tenant_memberships.role_id (FK)
- permissions(id) <- role_permissions.permission_id (FK)
- ai_action_log(tenant_id, actor_user_id) -> tenants/users
- ai_action_review(log_id, reviewer_user_id) -> ai_action_log/users
- ai_action_side_effect(log_id) -> ai_action_log
- Uniques: users.email; tenants.slug; tenant_memberships (tenant_id,user_id); roles (tenant_id,key); permissions.key

## Indexes
- users: (email UNIQUE), (provider_user_id), (is_platform_admin)
- tenants: (slug UNIQUE), (owner_user_id)
- tenant_memberships: (tenant_id,user_id UNIQUE), (user_id), (tenant_id)
- roles: (tenant_id,key UNIQUE), (is_system, key)
- role_permissions: (role_id,permission_id PK), (permission_id)
- permission_overrides: (membership_id)
- sessions: (user_id), (active_tenant_id), (expires_at), partial index on revoked_at IS NULL
- consents: (tenant_id,subject_type,subject_id,purpose_key,captured_at DESC), partial unique on (tenant_id,subject_type,subject_id,purpose_key) where revoked_at IS NULL
- ai_action_log: (tenant_id,created_at DESC), (tenant_id,needs_review,created_at DESC), (tenant_id,input_ref_table,input_ref_id), (prompt_hash), GIN on input_snapshot, output_snapshot, citations, tools_called
- ai_action_review: (log_id,created_at DESC)
- ai_action_side_effect: (log_id), (tenant_id,status,created_at DESC)

## Data Migration Strategy
1) Phase 1: Create core tables (users, tenants, roles, permissions, tenant_memberships, sessions). Seed global permissions and default system roles (OWNER, ADMIN, STAFF, VIEWER) and their role_permissions.
2) Phase 2: Add invitations and consent tables; migrate any pre-existing consents if applicable.
3) Phase 3: Create ai_action_log, ai_action_review, ai_action_side_effect; add trigger to prevent UPDATE/DELETE on ai_action_log; backfill from any existing AI events if present.
4) Phase 4: Add indexes incrementally and analyze; add partial indexes after initial data volume.
5) Optional later: introduce table partitioning for ai_action_log by month and enable pgvector with a separate migration to add a vector column for embeddings.

## Query Optimization Considerations
- Always filter by tenant_id; composite indexes include tenant_id as leading column.
- Use EXISTS joins for authorization checks: memberships -> roles -> role_permissions; cache permission results at app layer with TTL.
- For AI review queues: query ai_action_log where needs_review = true and NOT EXISTS approved review; leverage (tenant_id,needs_review,created_at) index.
- Use GIN indexes on JSONB snapshots for targeted filters (e.g., output_kind, classifications) with jsonb_path_ops.
- Keep ai_action_log immutable; store review/verdicts separately to avoid write amplification on large JSONB payloads.
- Batch insert role_permissions during seeding to reduce lock times; use deferred FK constraints in migrations when bulk-loading.

## User Stories
- As an owner, I create a tenant, invite teammates with roles, and set default permissions.
- As staff, I can only access records for my active tenant; switching tenants updates my session context.
- As a reviewer, I see pending AI proposals for my tenant, approve or reject, and see citations and costs.
- As compliance, I retrieve consent history for a customer and verify the active consent state.

## Success Criteria
- RBAC enforced at query boundary using tenant_id and permissions with <50ms average permission check latency (cached).
- AIActionLog writes are append-only; attempts to update/delete are blocked at DB level.
- Review queue queries return in <200ms at 1M ai_action_log rows (proper indexes).
- Unique email and slug constraints enforced; membership uniqueness per tenant ensured.
- Consents reflect correct effective state with no duplicate active consent per subject/purpose.


