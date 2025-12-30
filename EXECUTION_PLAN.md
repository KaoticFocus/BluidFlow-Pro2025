# BuildFlow Pro AI - Execution Plan
## Based on Updated PRDs (Dec 2024)

---

## Executive Summary

This execution plan outlines the implementation roadmap for completing the BuildFlow Pro AI backend based on three updated PRDs:
1. **Foundation: Auth + Tenant + RBAC + Audit Trail** (Partial - 3/6 endpoint groups implemented)
2. **TaskFlow MVP** (Partial - Core CRUD done, checklist & daily plan approval pending)
3. **Event Bus + Outbox + Event Log** (Partial - Outbox helper done, relay worker & event log pending)

### Current State
- ✅ **TypeScript foundation**: All type errors resolved (83 → 0)
- ✅ **Core infrastructure**: Hono app, middleware, shared types, Prisma models
- ✅ **Partial implementations**: RBAC routes, TaskFlow CRUD, tenant member management
- 🚧 **Pending**: Auth endpoints, tenant CRUD, AI actions, consents, event relay, checklist operations

### Implementation Phases
1. **Phase 1: Foundation Completion** (Weeks 1-2) - Critical path for all other features
2. **Phase 2: Core Feature Completion** (Weeks 3-4) - Complete TaskFlow and AI actions
3. **Phase 3: Event Infrastructure** (Weeks 5-6) - Event relay, consumers, schema registry
4. **Phase 4: Observability & Polish** (Week 7) - Telemetry, idempotency, performance optimization

### Success Metrics
- All PRD endpoints implemented and tested
- Zero TypeScript errors maintained
- Event-driven architecture fully operational
- RBAC enforced across all endpoints
- Audit trail complete for AI actions
- **Mobile-first API design**: Pagination, efficient payloads, offline support

### Mobile-First Requirements
The project explicitly requires **"Mobile-first + Web desktop"** as a non-negotiable principle. While Frontend PRDs address mobile UI, the backend APIs must support mobile clients with:
- **Pagination**: All list endpoints support cursor-based pagination
- **Efficient payloads**: Minimal data transfer, selective field inclusion
- **Offline support**: Idempotent operations, queuing capabilities
- **Performance**: Fast response times for mobile networks
- **Optimistic updates**: Support for client-side optimistic UI patterns

---

## Detailed Execution Plan

### Phase 1: Foundation Completion (Weeks 1-2)
**Goal**: Complete authentication, tenant management, and basic RBAC operations

#### 1.1 Auth Endpoints (`apps/api/src/routes/auth.ts`)
**Priority**: 🔴 Critical  
**Dependencies**: None  
**Effort**: 2-3 days

**Tasks**:
- [ ] Implement `POST /auth/signup`
  - Validate email uniqueness
  - Hash password
  - Create user, tenant, membership in transaction
  - Assign owner role
  - Emit `user.created.v1` and `tenant.created.v1` events
  - Return session token
- [ ] Implement `POST /auth/signin`
  - Validate credentials
  - Create session record
  - Emit `user.signed_in.v1` event
  - Return session token
- [ ] Implement `POST /auth/signout`
  - Invalidate session
  - Emit `user.signed_out.v1` event
- [ ] Implement `GET /auth/session`
  - Load user, tenant, permissions from DB
  - Return session details
- [ ] Implement `POST /auth/switch-tenant`
  - Validate membership
  - Update active tenant in session
  - Return updated session
- [ ] Implement `POST /auth/refresh`
  - Validate refresh token
  - Issue new session token
  - Update session expiry

**Files to Modify**:
- `apps/api/src/routes/auth.ts` - Uncomment and complete TODOs
- `apps/api/src/lib/password.ts` - Ensure password hashing utilities exist
- `apps/api/src/lib/slug.ts` - Ensure slug generation exists

**Acceptance Criteria**:
- All 6 endpoints return correct status codes
- Transactions ensure data consistency
- Events emitted via outbox pattern
- Password hashing uses secure algorithm (bcrypt/argon2)
- Session tokens are cryptographically secure

---

#### 1.2 Tenant CRUD (`apps/api/src/routes/tenants.ts`)
**Priority**: 🔴 Critical  
**Dependencies**: 1.1 (Auth)  
**Effort**: 2 days

**Tasks**:
- [ ] Implement `POST /tenants`
  - Validate user is authenticated
  - Create tenant with unique slug
  - Create membership with owner role
  - Emit `tenant.created.v1` event
- [ ] Implement `GET /tenants`
  - List user's tenants via memberships
  - Include tenant metadata
  - **Mobile-first**: Return minimal fields (id, name, slug) for list view
- [ ] Implement `GET /tenants/:id`
  - Validate membership
  - Return tenant details
- [ ] Implement `PATCH /tenants/:id`
  - Validate ownership or TENANTS_MANAGE permission
  - Update tenant metadata
  - Emit `tenant.updated.v1` event
- [ ] Complete `POST /tenants/:id/invite` (partially implemented)
  - Generate invite token
  - Store invite record
  - Send email (stub for now)
  - Emit `tenant.member.invited.v1` event
- [ ] Complete `GET /tenants/:id/members` (partially implemented)
  - Ensure proper RBAC filtering
  - **Mobile-first**: Add cursor pagination (cursor, limit params)
  - Return minimal member fields for list view

**Files to Modify**:
- `apps/api/src/routes/tenants.ts` - Complete remaining endpoints

**Acceptance Criteria**:
- All tenant operations respect RBAC
- Invite tokens are unique and time-limited
- Events emitted for all mutations
- Cross-tenant access prevented
- **Mobile-first**: List endpoints support pagination, minimal payloads

---

#### 1.3 RBAC Enhancements (`apps/api/src/routes/rbac.ts`)
**Priority**: 🟡 High  
**Dependencies**: 1.1 (Auth)  
**Effort**: 1-2 days

**Tasks**:
- [ ] Implement `POST /rbac/roles`
  - Validate TENANTS_MANAGE permission
  - Create custom tenant role
  - Return role details
- [ ] Implement `PUT /rbac/roles/:id/permissions`
  - Validate role ownership
  - Update role permissions
  - Emit `role.permissions.updated.v1` event

**Files to Modify**:
- `apps/api/src/routes/rbac.ts` - Add new endpoints
- `packages/events/src/foundation.ts` - Add role event schemas

**Acceptance Criteria**:
- Custom roles scoped to tenant
- Permission updates validated
- Events emitted for audit trail

---

#### 1.4 AI Actions (`apps/api/src/routes/ai.ts`)
**Priority**: 🟡 High  
**Dependencies**: 1.1 (Auth), 1.2 (Tenants)  
**Effort**: 2-3 days

**Tasks**:
- [ ] Complete `POST /ai/actions`
  - Uncomment Prisma implementation
  - Create AIActionLog record
  - Create side effects if present
  - Emit `ai.action.logged.v1` event
- [ ] Complete `GET /ai/actions`
  - Uncomment Prisma implementation
  - Implement filtering and pagination
  - **Mobile-first**: Cursor-based pagination (cursor, limit params)
  - **Mobile-first**: Return minimal fields for list (id, model, status, createdAt)
  - Include actor and decision details (full details only in detail endpoint)
- [ ] Complete `GET /ai/actions/:id`
  - Load full action details
  - Include all side effects and decisions
- [ ] Implement `POST /ai/actions/:id/approve`
  - Validate action status
  - Create decision record
  - Execute approved side effects
  - Emit `ai.action.approved.v1` event
- [ ] Implement `POST /ai/actions/:id/reject`
  - Validate action status
  - Create decision record
  - Emit `ai.action.rejected.v1` event
- [ ] Implement `GET /ai/actions/:id/history`
  - Return decision history
  - Include reviewer details

**Files to Modify**:
- `apps/api/src/routes/ai.ts` - Uncomment and complete TODOs
- `apps/api/src/lib/ai-side-effects.ts` - Create side effect executor (new file)

**Acceptance Criteria**:
- All AI actions logged with citations
- Review workflow enforced
- Side effects executed only after approval
- Full audit trail maintained
- **Mobile-first**: Efficient list endpoint with pagination

---

#### 1.5 Consents (`apps/api/src/routes/consents.ts`)
**Priority**: 🟡 High  
**Dependencies**: 1.1 (Auth)  
**Effort**: 1-2 days

**Tasks**:
- [ ] Complete `POST /consents`
  - Uncomment Prisma implementation
  - Create consent record
  - Emit `consent.captured.v1` event
- [ ] Complete `GET /consents`
  - Uncomment Prisma implementation
  - Implement filtering
- [ ] Implement `POST /consents/:id/revoke`
  - Validate consent exists
  - Update revokedAt timestamp
  - Emit `consent.revoked.v1` event
- [ ] Complete `GET /consents/check`
  - Check for active consent
  - Return consent status

**Files to Modify**:
- `apps/api/src/routes/consents.ts` - Uncomment and complete TODOs

**Acceptance Criteria**:
- Consents properly scoped to tenant
- Revocation tracked with timestamp
- Events emitted for audit

---

**Phase 1 Deliverables**:
- ✅ All foundation endpoints implemented
- ✅ Full RBAC enforcement
- ✅ Complete audit trail for all mutations
- ✅ Events emitted via outbox pattern

**Phase 1 Success Criteria**:
- All 6 auth endpoints functional
- All 6 tenant endpoints functional
- All 6 RBAC endpoints functional
- All 6 AI action endpoints functional
- All 4 consent endpoints functional
- Zero TypeScript errors
- All endpoints return proper status codes

---

### Phase 2: Core Feature Completion (Weeks 3-4)
**Goal**: Complete TaskFlow MVP features and integrate with foundation

#### 2.1 TaskFlow Checklist Operations (`apps/api/src/routes/taskflow.ts`)
**Priority**: 🟡 High  
**Dependencies**: Phase 1  
**Effort**: 1-2 days

**Tasks**:
- [ ] Implement `POST /taskflow/tasks/:id/checklist`
  - Validate task exists and user has access
  - Create checklist item
  - Emit `task.checklist_item.created.v1` event
- [ ] Implement `PATCH /taskflow/tasks/:id/checklist/:itemId`
  - Validate item belongs to task
  - Update item (text, completed, position)
  - Check if all items completed → auto-complete task
  - Emit `task.checklist_item.updated.v1` event
  - Emit `task.completed.v1` if task completed
- [ ] Update `GET /taskflow/tasks/:id` to include checklist items
- [ ] **Mobile-first**: Update `GET /taskflow/tasks` list endpoint
  - Replace hardcoded `take: 100` with cursor pagination
  - Add `cursor` and `limit` query params (default limit: 20 for mobile)
  - Return `nextCursor` in response
  - **Mobile-first**: Add `fields` query param for selective field inclusion
  - Return minimal fields for list view (id, title, status, due_date, priority)

**Files to Modify**:
- `apps/api/src/routes/taskflow.ts` - Add checklist endpoints, update list endpoint
- `packages/events/src/taskflow.ts` - Add checklist event schemas (new file)

**Acceptance Criteria**:
- Checklist items properly scoped to tasks
- Task auto-completes when all items done
- Events emitted for all mutations
- **Mobile-first**: List endpoint supports pagination and field selection

---

#### 2.2 Daily Plan Approval (`apps/api/src/routes/taskflow.ts`)
**Priority**: 🟡 High  
**Dependencies**: Phase 1, 2.1  
**Effort**: 2-3 days

**Tasks**:
- [ ] Implement daily plan generation logic
  - Query tasks: TODO/IN_PROGRESS due on/before date
  - Include recent approved-AI tasks
  - Include backlog items
  - Cap at 16 items
  - Preserve pinned ordering
  - Calculate metrics (total, pinned, dueToday, overdue)
- [ ] Implement `POST /taskflow/daily-plans/:id/approve`
  - Validate plan status is 'pending_approval'
  - Update status to 'published'
  - Set publishedAt timestamp
  - Emit `daily_plan.published.v1` event
- [ ] Add performance optimization
  - Ensure generation completes in <500ms for 200 tasks
  - Add database indexes if needed

**Files to Modify**:
- `apps/api/src/routes/taskflow.ts` - Complete daily plan generation
- `packages/db/prisma/schema.prisma` - Add indexes if needed

**Acceptance Criteria**:
- Daily plan generation follows heuristic
- Approval workflow enforced
- Performance targets met
- Events emitted

---

#### 2.3 Transcript Consumer (`apps/api/src/workers/consumers/transcriptReady.ts`)
**Priority**: 🟡 High  
**Dependencies**: Phase 1, 2.1  
**Effort**: 2-3 days

**Tasks**:
- [ ] Create worker file structure
  - `apps/api/src/workers/consumers/transcriptReady.ts`
  - `apps/api/src/workers/index.ts` (worker registry)
- [ ] Implement TranscriptReady.v1 consumer
  - Listen for `transcript.ready.v1` events
  - Extract action items from transcript using AI
  - Create AIActionLog proposals with citations
  - Dedupe by (tenantId, transcriptId, contentHash)
  - Emit events for proposals
- [ ] Integrate with OpenAI API
  - Use OpenAI for task extraction
  - Include citations in proposals
  - Track token usage

**Files to Create**:
- `apps/api/src/workers/consumers/transcriptReady.ts` (new)
- `apps/api/src/workers/index.ts` (new)
- `apps/api/src/lib/openai.ts` (new - OpenAI wrapper)

**Files to Modify**:
- `apps/api/src/index.ts` - Register workers

**Acceptance Criteria**:
- Consumer idempotent (dedupe key)
- Proposals include citations
- AIActionLog created with proper status
- Token usage tracked

---

#### 2.4 Idempotency Layer (`apps/api/src/middleware/idempotency.ts`)
**Priority**: 🟢 Medium  
**Dependencies**: Phase 1  
**Effort**: 1-2 days

**Tasks**:
- [ ] Create idempotency middleware
  - Extract Idempotency-Key header
  - Hash key with tenantId + route + body
  - Check for existing response (24h TTL)
  - Store response if new
  - Return cached response if duplicate
- [ ] Apply to mutation endpoints
  - POST /taskflow/tasks
  - POST /tenants/:id/invite
  - POST /rbac/assign
  - Other POST/PATCH endpoints
- [ ] **Mobile-first**: Support offline queuing
  - Allow clients to queue requests with Idempotency-Key
  - Return 202 Accepted for queued requests
  - Process when online
  - Return same response when retried

**Files to Create**:
- `apps/api/src/middleware/idempotency.ts` (new)
- `packages/db/prisma/schema.prisma` - Add IdempotencyKey model

**Acceptance Criteria**:
- Duplicate requests return same response
- 409 status on true duplicates
- 24h TTL enforced
- Tenant-scoped keys
- **Mobile-first**: Supports offline request queuing

---

**Phase 2 Deliverables**:
- ✅ Complete TaskFlow MVP
- ✅ Checklist operations functional
- ✅ Daily plan generation and approval
- ✅ Transcript consumer operational
- ✅ Idempotency enforced

**Phase 2 Success Criteria**:
- All TaskFlow endpoints complete
- Daily plans generated correctly
- Transcripts processed automatically
- Idempotency prevents duplicates

---

### Phase 3: Event Infrastructure (Weeks 5-6)
**Goal**: Complete event-driven architecture with relay, consumers, and schema registry

#### 3.1 Event Log Schema (`packages/db/prisma/schema.prisma`)
**Priority**: 🔴 Critical  
**Dependencies**: None  
**Effort**: 1 day

**Tasks**:
- [ ] Create EventLog model
  - sequence (bigserial, primary key)
  - event_id (uuid, unique)
  - tenant_id
  - schema_id, schema_version
  - headers (jsonb)
  - payload_redacted (jsonb)
  - payload_hash
  - published_at
- [ ] Create ConsumerEvent model
  - consumer_name, event_id (composite unique)
  - processed_at
  - attempts
  - last_error
  - status (enum)
- [ ] Create DLQMessage model
  - consumer_name, event_id
  - failure_reason
  - payload_snapshot (jsonb)
  - created_at
- [ ] Add indexes
  - (tenant_id, sequence)
  - (schema_id, sequence)
  - (correlation_id)
  - (consumer_name, event_id)

**Files to Modify**:
- `packages/db/prisma/schema.prisma` - Add models
- Run migration

**Acceptance Criteria**:
- All models created
- Indexes optimized for queries
- Immutability enforced (no UPDATE/DELETE on event_log)

---

#### 3.2 Outbox Relay Worker (`apps/api/src/workers/outbox-relay.worker.ts`)
**Priority**: 🔴 Critical  
**Dependencies**: 3.1  
**Effort**: 3-4 days

**Tasks**:
- [ ] Set up BullMQ infrastructure
  - Install bullmq, ioredis
  - Configure Redis connection
  - Create queue: `outbox-relay`
- [ ] Implement relay worker
  - Poll outbox table for pending events
  - Process in batches (10-20 at a time)
  - Move to event_log with idempotent publish
  - Handle retries with exponential backoff
  - Move to DLQ after max attempts (10)
  - Update outbox status
- [ ] Add visibility timeout
  - Prevent stuck rows
  - Handle not_before for delayed publish
- [ ] Add observability
  - Log relay lag
  - Track publish latency
  - Monitor DLQ size

**Files to Create**:
- `apps/api/src/workers/outbox-relay.worker.ts` (new)
- `apps/api/src/lib/redis.ts` (new - Redis client)
- `apps/api/src/lib/event-relay.ts` (new - Relay logic)

**Files to Modify**:
- `apps/api/src/workers/index.ts` - Register relay worker
- `apps/api/src/index.ts` - Start workers

**Acceptance Criteria**:
- Events moved from outbox to event_log
- At-least-once delivery guaranteed
- Idempotent publish (unique event_id)
- Retry logic functional
- DLQ captures failures

---

#### 3.3 Schema Registry (`packages/events/src/validate.ts`)
**Priority**: 🟡 High  
**Dependencies**: 3.1  
**Effort**: 2-3 days

**Tasks**:
- [ ] Create schema registry
  - Map schema_id@version to Zod schemas
  - Support wildcard matching (e.g., `customer.*@v1`)
  - Validate payloads against schemas
- [ ] Export JSON Schema
  - Generate JSON Schema from Zod
  - Store in registry
  - Support cross-service validation
- [ ] Implement validation function
  - `validateEvent(schemaId, version, payload)`
  - Return validation errors
  - Support deprecation warnings

**Files to Create**:
- `packages/events/src/validate.ts` (new)
- `packages/events/src/registry.ts` (new)
- `packages/events/src/schemas/index.ts` (new - Export all schemas)

**Files to Modify**:
- `packages/events/src/foundation.ts` - Ensure schemas exportable
- `packages/events/src/taskflow.ts` - Add task event schemas

**Acceptance Criteria**:
- All events validated against schemas
- JSON Schema exported for each event
- Validation errors returned clearly
- Deprecation policy enforced

---

#### 3.4 Internal Event API (`apps/api/src/routes/internal/events.ts`)
**Priority**: 🟡 High  
**Dependencies**: 3.2, 3.3  
**Effort**: 2 days

**Tasks**:
- [ ] Implement `POST /internal/events/ingest`
  - Authenticate with service token + HMAC
  - Validate schema_id@version
  - Validate payload against schema
  - Write to outbox
  - Return 202 with event_id
- [ ] Implement `GET /internal/event-log`
  - Authenticate with events:read scope
  - Query by after_sequence, tenant_id, schema_id
  - Return ordered events (limit 1000)
  - Include headers + payload_redacted
- [ ] Implement `GET /internal/event-schemas`
  - List all schema_id@version
  - Include compatibility status
  - Include deprecation info

**Files to Create**:
- `apps/api/src/routes/internal/events.ts` (new)
- `apps/api/src/middleware/service-auth.ts` (new - Service token auth)

**Files to Modify**:
- `apps/api/src/index.ts` - Register internal routes

**Acceptance Criteria**:
- Service authentication enforced
- Schema validation on ingest
- Event log queryable
- Schema registry exposed

---

#### 3.5 Consumer Framework (`apps/api/src/workers/consumers/base-consumer.ts`)
**Priority**: 🟡 High  
**Dependencies**: 3.1, 3.2  
**Effort**: 3-4 days

**Tasks**:
- [ ] Create base consumer class
  - Abstract consumer logic
  - Handle idempotency (ConsumerEvent table)
  - Checkpoint by sequence
  - Retry policy per consumer
  - DLQ on exhaustion
- [ ] Implement subscription filtering
  - Filter by schema_id prefix
  - Support wildcards
  - Efficient matching
- [ ] Add replay capability
  - Seek by sequence range
  - Reprocess without republishing
- [ ] Create TranscriptReady consumer (refactor from 2.3)
  - Extend base consumer
  - Implement process method

**Files to Create**:
- `apps/api/src/workers/consumers/base-consumer.ts` (new)
- `apps/api/src/workers/consumers/transcriptReady.ts` (refactor)

**Files to Modify**:
- `apps/api/src/workers/index.ts` - Use base consumer

**Acceptance Criteria**:
- Consumers idempotent
- Checkpointing functional
- Retry logic works
- DLQ captures failures
- Replay supported

---

**Phase 3 Deliverables**:
- ✅ Event log operational
- ✅ Outbox relay processing events
- ✅ Schema registry validating events
- ✅ Internal API for event management
- ✅ Consumer framework with idempotency

**Phase 3 Success Criteria**:
- Events flow: outbox → relay → event_log
- All events validated against schemas
- Consumers process exactly-once
- DLQ captures failures
- Replay functional

---

### Phase 4: Observability & Polish (Week 7)
**Goal**: Add telemetry, optimize performance, complete remaining features

#### 4.1 OpenTelemetry Integration (`apps/api/src/lib/otel.ts`)
**Priority**: 🟢 Medium  
**Dependencies**: Phase 1-3  
**Effort**: 2-3 days

**Tasks**:
- [ ] Set up OpenTelemetry
  - Install @opentelemetry packages
  - Configure trace exporter
  - Create spans for endpoints
  - Propagate trace_id/span_id in events
- [ ] Add spans to routes
  - Wrap route handlers
  - Include tenant_id, user_id in attributes
  - Track latency
- [ ] Add spans to workers
  - Wrap consumer processing
  - Link to event correlation_id
- [ ] Add spans to outbox relay
  - Track relay lag
  - Link to domain action spans

**Files to Create**:
- `apps/api/src/lib/otel.ts` (new)
- `apps/api/src/middleware/tracing.ts` (new)

**Files to Modify**:
- `apps/api/src/index.ts` - Initialize OTEL
- All route files - Add tracing middleware
- Worker files - Add spans

**Acceptance Criteria**:
- Traces link domain → outbox → relay → consumer
- Correlation IDs propagated
- Latency tracked
- No PII in traces

---

#### 4.2 PostHog Events (`apps/api/src/lib/analytics.ts`)
**Priority**: 🟢 Medium  
**Dependencies**: Phase 1-3  
**Effort**: 1-2 days

**Tasks**:
- [ ] Set up PostHog client
  - Install posthog-node
  - Configure API key
  - Create wrapper functions
- [ ] Add events to endpoints
  - task_created, task_completed
  - checklist_item_completed
  - daily_plan_generated, daily_plan_published
  - tenant_created, member_invited
  - ai_action_logged, ai_action_approved
- [ ] Add events to workers
  - event_published
  - event_consumed
  - consumer_retry
  - dlq_message_created

**Files to Create**:
- `apps/api/src/lib/analytics.ts` (new)

**Files to Modify**:
- Route files - Add PostHog events
- Worker files - Add PostHog events

**Acceptance Criteria**:
- All key actions tracked
- Events include tenant_id
- No PII in events
- Events structured consistently

---

#### 4.3 Sentry Integration (`apps/api/src/lib/sentry.ts`)
**Priority**: 🟢 Medium  
**Dependencies**: Phase 1-3  
**Effort**: 1 day

**Tasks**:
- [ ] Configure Sentry
  - Install @sentry/node
  - Set up error capture
  - Configure PII redaction
  - Add context (tenant_id, user_id)
- [ ] Add error boundaries
  - Wrap route handlers
  - Wrap worker processing
  - Capture unhandled errors
- [ ] Add performance monitoring
  - Track slow queries
  - Monitor API latency

**Files to Create**:
- `apps/api/src/lib/sentry.ts` (new)

**Files to Modify**:
- `apps/api/src/index.ts` - Initialize Sentry
- Route files - Add error handling

**Acceptance Criteria**:
- Errors captured with context
- PII redacted
- Performance monitored
- No noise in Sentry

---

#### 4.4 Performance Optimization
**Priority**: 🟢 Medium  
**Dependencies**: Phase 1-3  
**Effort**: 2-3 days

**Tasks**:
- [ ] Database query optimization
  - Review slow queries
  - Add missing indexes
  - Optimize N+1 queries
  - Add query logging in dev
- [ ] Daily plan generation optimization
  - Ensure <500ms for 200 tasks
  - Add caching if needed
  - Optimize task queries
- [ ] Event relay optimization
  - Batch processing
  - Parallel processing
  - Backpressure handling
- [ ] API endpoint optimization
  - Ensure p95 <250ms
  - Add response caching where appropriate
  - Optimize serialization

**Files to Modify**:
- `packages/db/prisma/schema.prisma` - Add indexes
- Route files - Optimize queries
- Worker files - Optimize processing

**Acceptance Criteria**:
- Daily plan generation <500ms
- API endpoints p95 <250ms
- Event relay handles 100+ events/sec
- No N+1 queries

---

#### 4.5 PII Redaction Pipeline (`apps/api/src/lib/pii-redaction.ts`)
**Priority**: 🟡 High  
**Dependencies**: 3.2  
**Effort**: 2-3 days

**Tasks**:
- [ ] Create PII detection
  - Use regex patterns (email, phone, SSN)
  - Use OpenAI for advanced detection
  - Tag PII in headers (pii_tags[])
- [ ] Create redaction function
  - Replace PII with placeholders
  - Store redacted payload in event_log
  - Keep original in outbox (encrypted?)
- [ ] Integrate with event relay
  - Redact before writing to event_log
  - Maintain pii_tags in headers

**Files to Create**:
- `apps/api/src/lib/pii-redaction.ts` (new)

**Files to Modify**:
- `apps/api/src/workers/outbox-relay.worker.ts` - Add redaction

**Acceptance Criteria**:
- PII detected and tagged
- Redacted payloads stored
- Original data protected
- Audit trail maintained

---

#### 4.6 Cloudflare R2 Integration (`apps/api/src/lib/storage.ts`)
**Priority**: 🟢 Medium  
**Dependencies**: Phase 1  
**Effort**: 1-2 days

**Tasks**:
- [ ] Set up R2 client
  - Install @aws-sdk/client-s3
  - Configure R2 credentials
  - Create wrapper functions
- [ ] Implement presign endpoint
  - Generate presigned URLs
  - Set expiration (5 minutes)
  - Return upload URL
- [ ] Implement attachment storage
  - Store attachments in R2
  - Link to tasks/meetings
  - Generate download URLs

**Files to Create**:
- `apps/api/src/lib/storage.ts` (new)

**Files to Modify**:
- `apps/api/src/routes/taskflow.ts` - Complete presign endpoint

**Acceptance Criteria**:
- Presigned URLs generated
- Attachments stored securely
- Download URLs work
- Tenant isolation enforced

---

**Phase 4 Deliverables**:
- ✅ Full observability stack
- ✅ Performance optimized
- ✅ PII redaction operational
- ✅ Storage integration complete

**Phase 4 Success Criteria**:
- Traces link all operations
- Events tracked in PostHog
- Errors captured in Sentry
- Performance targets met
- PII protected

---

## Mobile-First API Implementation Guidelines

### Pagination Utility (Create Early)
**Priority**: 🔴 Critical - Implement in Phase 1  
**File**: `apps/api/src/lib/pagination.ts` (new)

```typescript
// Standard pagination helper
export interface PaginationParams {
  cursor?: string;
  limit?: number;
  maxLimit?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export function parsePagination(c: Context): PaginationParams {
  const cursor = c.req.query("cursor");
  const limit = Math.min(
    parseInt(c.req.query("limit") || "20"),
    100 // max limit
  );
  return { cursor, limit, maxLimit: 100 };
}

export function createPaginatedResponse<T>(
  items: T[],
  limit: number,
  getCursor: (item: T) => string
): PaginatedResponse<T> {
  const hasMore = items.length > limit;
  const result = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore && result.length > 0 
    ? getCursor(result[result.length - 1]) 
    : null;
  
  return {
    items: result,
    nextCursor,
    hasMore,
  };
}
```

### Field Selection Utility
**File**: `apps/api/src/lib/field-selection.ts` (new)

```typescript
// Selective field inclusion for mobile efficiency
export function selectFields<T extends Record<string, any>>(
  obj: T,
  fields?: string
): Partial<T> {
  if (!fields) return obj;
  const fieldSet = new Set(fields.split(","));
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => fieldSet.has(key))
  ) as Partial<T>;
}
```

### Mobile-First Checklist
For each list endpoint, ensure:
- [ ] Cursor-based pagination implemented
- [ ] Default limit: 20 items
- [ ] `fields` query param supported
- [ ] Response includes `nextCursor` and `hasMore`
- [ ] Minimal payload (only necessary fields in list view)
- [ ] Performance target: <200ms p95

For each mutation endpoint, ensure:
- [ ] Idempotency-Key header supported
- [ ] 202 Accepted for queued requests (offline support)
- [ ] Same response returned for duplicate requests
- [ ] Performance target: <300ms p95

## Implementation Guidelines

### Code Quality Standards
- **TypeScript**: Strict mode, no `any` types (except where necessary for Prisma)
- **Error Handling**: Use HTTPException for API errors, proper status codes
- **Transactions**: Use Prisma transactions for multi-step operations
- **Events**: Always emit events via outbox pattern for mutations
- **RBAC**: Enforce permissions on all mutation endpoints
- **Testing**: Write unit tests for business logic, integration tests for endpoints
- **Mobile-First API Design**:
  - All list endpoints support cursor pagination (cursor, limit params)
  - Default limit: 20 items for mobile efficiency
  - Return `nextCursor` in paginated responses
  - Support `fields` query param for selective field inclusion
  - Minimize payload sizes (return only necessary fields in list views)
  - Idempotent mutations support offline queuing
  - Fast response times (<250ms p95) for mobile networks

### File Organization
```
apps/api/src/
├── routes/           # API route handlers
├── middleware/       # Auth, idempotency, tracing
├── lib/             # Utilities (outbox, storage, AI, etc.)
├── workers/         # Background workers
│   ├── consumers/   # Event consumers
│   └── outbox-relay.worker.ts
└── index.ts         # App entry point

packages/
├── shared/src/      # Shared types and schemas
├── events/src/      # Event schemas and registry
└── db/src/          # Prisma client
```

### Event Naming Convention
- Format: `<domain>.<entity>.<action>@v<major>`
- Examples:
  - `user.created.v1`
  - `tenant.member.invited.v1`
  - `task.completed.v1`
  - `ai.action.approved.v1`

### Database Best Practices
- Always use transactions for multi-step operations
- Add indexes for query patterns
- Use tenant_id in all queries (multi-tenant isolation)
- Never UPDATE/DELETE event_log (immutable)
- Use soft deletes where appropriate

### Testing Strategy
- **Unit Tests**: Test business logic functions
- **Integration Tests**: Test API endpoints with test database
- **E2E Tests**: Test full flows (signup → create task → approve)
- **Worker Tests**: Test event consumers with mock events

---

## Risk Mitigation

### Technical Risks
1. **Event Relay Failure**: Implement DLQ and monitoring
2. **Performance Degradation**: Add indexes, optimize queries early
3. **PII Leakage**: Implement redaction before Phase 4
4. **Idempotency Gaps**: Test thoroughly, use unique constraints

### Timeline Risks
1. **Scope Creep**: Stick to PRD requirements, defer enhancements
2. **Dependency Delays**: Start Phase 3 early if Phase 1-2 complete early
3. **Integration Issues**: Test integrations incrementally

---

## Success Metrics

### Phase 1
- ✅ 28 endpoints implemented (6 auth + 6 tenant + 6 RBAC + 6 AI + 4 consent)
- ✅ Zero TypeScript errors
- ✅ All endpoints return correct status codes
- ✅ Events emitted for all mutations
- ✅ **Mobile-first**: List endpoints support pagination
- ✅ **Mobile-first**: Efficient payload sizes

### Phase 2
- ✅ TaskFlow MVP complete (all endpoints)
- ✅ Daily plan generation <500ms
- ✅ Transcript consumer operational
- ✅ Idempotency enforced
- ✅ **Mobile-first**: TaskFlow list endpoint paginated
- ✅ **Mobile-first**: Offline queuing support via idempotency

### Phase 3
- ✅ Event relay processing 100+ events/sec
- ✅ Event log queryable
- ✅ Consumers idempotent
- ✅ Schema validation enforced

### Phase 4
- ✅ Full observability (traces, events, errors)
- ✅ Performance targets met
- ✅ PII redaction operational
- ✅ Storage integration complete

---

## Mobile-First API Requirements Summary

### Pagination Pattern (All List Endpoints)
```typescript
// Request
GET /taskflow/tasks?cursor=<uuid>&limit=20&fields=id,title,status

// Response
{
  items: [...],
  nextCursor: "<uuid>" | null,
  hasMore: boolean
}
```

### Field Selection Pattern
```typescript
// Request minimal fields for list view
GET /taskflow/tasks?fields=id,title,status,due_date

// Request full fields for detail view
GET /taskflow/tasks/:id  // Returns all fields
```

### Offline Support Pattern
```typescript
// Client queues request with Idempotency-Key
POST /taskflow/tasks
Headers: { Idempotency-Key: "<client-generated-uuid>" }
Body: { ... }

// Server returns 202 Accepted if queued, 201 Created if processed
// Client retries with same Idempotency-Key → gets same response
```

### Performance Targets
- List endpoints: <200ms p95 (mobile networks)
- Detail endpoints: <250ms p95
- Mutation endpoints: <300ms p95
- Default pagination limit: 20 items (mobile-optimized)

## Next Steps

1. **Review this plan** with team
2. **Set up project board** (GitHub Projects, Linear, etc.)
3. **Create issues** for each task
4. **Assign priorities** based on dependencies
5. **Start Phase 1.1** (Auth endpoints)
6. **Implement pagination utilities** early (shared middleware/helpers)

---

**Document Version**: 1.0  
**Last Updated**: Dec 30, 2024  
**Based on PRDs**: Foundation Auth+RBAC, TaskFlow MVP, Event Bus+Outbox

