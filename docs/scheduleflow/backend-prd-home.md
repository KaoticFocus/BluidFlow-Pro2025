# ScheduleFlow Backend PRD — Home

> **Last updated:** 2026-01-03  
> **Status:** Draft

## Service Boundaries

ScheduleFlow backend is implemented as a set of Hono routes under `/v1/schedules`. It interacts with:

- **Database**: Prisma client for PostgreSQL
- **Auth Service**: JWT validation and RBAC checks
- **Notification Service**: BullMQ queue for async notifications
- **Audit Service**: Event logging for all mutations

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│   Web Client    │────▶│  API Gateway     │────▶│  Hono API   │
└─────────────────┘     │  (Auth + Tenant) │     └──────┬──────┘
                        └──────────────────┘            │
                                                        ▼
                        ┌──────────────────┐     ┌─────────────┐
                        │   BullMQ Queue   │◀────│   Prisma    │
                        │  (Notifications) │     │  (Postgres) │
                        └──────────────────┘     └─────────────┘
```

## Endpoints

### GET /v1/schedules

List schedules for the current tenant.

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | string | No | Filter by status (comma-separated) |
| `from` | ISO date | No | Start date filter |
| `to` | ISO date | No | End date filter |
| `search` | string | No | Search name/description |
| `page` | number | No | Page number (default: 1) |
| `pageSize` | number | No | Items per page (default: 20, max: 100) |
| `sortBy` | string | No | Sort field (default: updatedAt) |
| `sortOrder` | string | No | asc or desc (default: desc) |

**Response:**

```json
{
  "items": [
    {
      "id": "uuid",
      "name": "Q1 Schedule",
      "description": "...",
      "startAt": "2026-01-01T00:00:00Z",
      "endAt": "2026-03-31T23:59:59Z",
      "timezone": "America/New_York",
      "status": "approved",
      "activityCount": 15,
      "assignedUsers": [
        { "id": "uuid", "name": "John", "avatarUrl": "..." }
      ],
      "createdAt": "2026-01-01T10:00:00Z",
      "updatedAt": "2026-01-02T14:30:00Z"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 45,
  "hasMore": true
}
```

**Authorization:**
- Requires `scheduleflow:read` permission
- Results filtered by `org_id` from auth context

**Validation:**
- `pageSize` clamped to 1-100
- `status` validated against enum
- `from`/`to` parsed as ISO dates

---

### POST /v1/schedules

Create a new schedule.

**Request Body:**

```json
{
  "name": "Q1 Schedule",
  "description": "First quarter project schedule",
  "startAt": "2026-01-01T00:00:00Z",
  "endAt": "2026-03-31T23:59:59Z",
  "timezone": "America/New_York"
}
```

**Validation (Zod):**

```typescript
const CreateScheduleSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  timezone: z.string().min(1).max(50),
}).refine(data => new Date(data.endAt) > new Date(data.startAt), {
  message: "End date must be after start date"
});
```

**Response:** `201 Created`

```json
{
  "id": "uuid",
  "name": "Q1 Schedule",
  "status": "draft",
  "createdAt": "2026-01-03T10:00:00Z"
}
```

**Authorization:**
- Requires `scheduleflow:create` permission

**Side Effects:**
- Audit log entry created
- `schedule.created` event emitted

---

### GET /v1/schedules/:id

Get schedule detail with activities.

**Response:**

```json
{
  "id": "uuid",
  "name": "Q1 Schedule",
  "description": "...",
  "startAt": "2026-01-01T00:00:00Z",
  "endAt": "2026-03-31T23:59:59Z",
  "timezone": "America/New_York",
  "status": "approved",
  "approvedBy": { "id": "uuid", "name": "Jane Doe" },
  "approvedAt": "2026-01-02T14:30:00Z",
  "activities": [
    {
      "id": "uuid",
      "name": "Foundation work",
      "activityType": "work",
      "startAt": "2026-01-05T08:00:00Z",
      "endAt": "2026-01-05T17:00:00Z",
      "assignedUser": { "id": "uuid", "name": "John" }
    }
  ],
  "createdBy": { "id": "uuid", "name": "Admin" },
  "createdAt": "2026-01-01T10:00:00Z",
  "updatedAt": "2026-01-02T14:30:00Z"
}
```

**Authorization:**
- Requires `scheduleflow:read` permission
- 404 if not found or not in tenant

---

### POST /v1/schedules/:id/approve

Approve a pending schedule.

**Request Body:**

```json
{
  "comment": "Looks good, approved for execution"
}
```

**Response:** `200 OK`

```json
{
  "id": "uuid",
  "status": "approved",
  "approvedAt": "2026-01-03T10:00:00Z"
}
```

**Authorization:**
- Requires `scheduleflow:approve` permission

**Validation:**
- Schedule must be in `pending` status

**Side Effects:**
- Status updated to `approved`
- Audit log entry created
- Notification queue populated (if configured)

---

## Authentication and Authorization

### Auth Middleware

All endpoints use the standard auth middleware stack:

```typescript
scheduleRouter.use('*', authMiddleware, tenantMiddleware);
```

### RBAC Permissions

| Permission | Description |
|------------|-------------|
| `scheduleflow:read` | View schedules and activities |
| `scheduleflow:create` | Create new schedules |
| `scheduleflow:update` | Edit existing schedules |
| `scheduleflow:delete` | Delete schedules |
| `scheduleflow:approve` | Approve/reject schedules |
| `scheduleflow:notify` | Send notifications |

### Role Mapping

| Role | Permissions |
|------|-------------|
| Admin | All |
| Project Manager | read, create, update, notify |
| Superintendent | read |
| Crew Lead | read (own assignments only) |

## Validation

All request bodies are validated using Zod schemas defined in `apps/api/src/lib/schemas/schedule.ts`.

**Error Response:**

```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [
    { "path": ["name"], "message": "Required" }
  ]
}
```

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| GET /v1/schedules | 100 req/min |
| POST /v1/schedules | 20 req/min |
| POST .../approve | 10 req/min |
| POST .../notify | 5 req/min |

## Idempotency

Create and mutation endpoints support idempotency via `Idempotency-Key` header:

```http
POST /v1/schedules
Idempotency-Key: abc123-unique-key
```

- Keys are stored in Redis with 24h TTL
- Duplicate requests return cached response

## Background Jobs

### Notification Queue

Notifications are processed asynchronously via BullMQ:

```typescript
// Queue: scheduleflow-notifications
{
  "scheduleId": "uuid",
  "recipientId": "uuid",
  "channel": "email",
  "templateKey": "schedule_approved",
  "payload": { ... }
}
```

**Job Options:**
- Retry: 3 attempts with exponential backoff
- Timeout: 30 seconds
- Priority: normal

### Constraint Validation Job

For large schedules, constraint validation runs as a background job:

```typescript
// Queue: scheduleflow-validation
{
  "scheduleId": "uuid",
  "triggeredBy": "save"
}
```

## Observability

### Logging

All requests logged with:
- Request ID (correlation)
- Tenant ID
- User ID
- Duration
- Status code

```json
{
  "level": "info",
  "requestId": "abc123",
  "tenantId": "org-xyz",
  "userId": "user-123",
  "method": "POST",
  "path": "/v1/schedules",
  "duration": 45,
  "status": 201
}
```

### Metrics

| Metric | Type | Labels |
|--------|------|--------|
| `scheduleflow_requests_total` | Counter | method, path, status |
| `scheduleflow_request_duration_seconds` | Histogram | method, path |
| `scheduleflow_schedules_total` | Gauge | status |
| `scheduleflow_notifications_queued` | Counter | channel |

### Traces

OpenTelemetry spans for:
- HTTP request handling
- Database queries
- Queue operations
- External API calls

## SLIs/SLOs

| SLI | SLO | Alert Threshold |
|-----|-----|-----------------|
| Availability | 99.9% | < 99.5% for 5 min |
| Latency (P95) | < 200ms | > 500ms for 5 min |
| Error rate | < 0.1% | > 1% for 5 min |
| Notification delivery | > 99% | < 95% for 15 min |

## Alerts

| Alert | Condition | Severity | Action |
|-------|-----------|----------|--------|
| High error rate | Error rate > 1% | P2 | Check logs, investigate |
| Latency spike | P95 > 500ms | P3 | Check DB, scale if needed |
| Notification failures | Failure rate > 5% | P2 | Check Twilio, retry queue |
| Queue backlog | > 1000 pending | P3 | Scale workers |
