# ScheduleFlow PRD — MVP

> **Last updated:** 2026-01-03  
> **Status:** Draft  
> **Owner:** TBD

## Goals

1. Enable project managers to create and manage construction schedules
2. Provide constraint-aware scheduling with validation
3. Support approval workflows before schedule finalization
4. Deliver notifications to affected crew members
5. Maintain complete audit trail of all changes

## Non-Goals (MVP)

- Advanced AI schedule optimization (future phase)
- Resource leveling and cost optimization
- Integration with Primavera or MS Project (future phase)
- Real-time collaborative editing
- Gantt chart visualization (list view only for MVP)

## Personas

| Persona | Description | Primary Actions |
|---------|-------------|-----------------|
| **Project Manager** | Creates and manages schedules | Create, edit, approve, notify |
| **Superintendent** | Oversees daily operations | View, receive notifications |
| **Crew Lead** | Manages team assignments | View assigned activities |
| **Admin** | Configures system settings | Manage constraints, templates |

## User Stories

### Schedule Management

| ID | As a... | I want to... | So that... | Priority |
|----|---------|--------------|------------|----------|
| S1 | PM | create a new schedule with date range | I can plan project activities | P0 |
| S2 | PM | add activities with start/end times | I can define work periods | P0 |
| S3 | PM | assign roles/users to activities | crew knows their responsibilities | P0 |
| S4 | PM | edit existing schedules | I can adjust to changes | P0 |
| S5 | PM | delete schedules in draft status | I can remove mistakes | P1 |
| S6 | PM | duplicate a schedule | I can create similar schedules quickly | P2 |

### Constraints

| ID | As a... | I want to... | So that... | Priority |
|----|---------|--------------|------------|----------|
| C1 | Admin | define constraint rules | schedules follow business rules | P1 |
| C2 | PM | see constraint violations | I can fix issues before approval | P0 |
| C3 | PM | override constraints with reason | I can handle exceptions | P1 |

### Notifications

| ID | As a... | I want to... | So that... | Priority |
|----|---------|--------------|------------|----------|
| N1 | PM | send notifications when schedule approved | crew is informed | P0 |
| N2 | Crew | receive notifications via preferred channel | I stay informed | P0 |
| N3 | PM | preview notifications before sending | I can verify content | P1 |
| N4 | Admin | configure notification templates | messages are consistent | P2 |

## Functional Requirements

### FR1: Schedule CRUD

- **Create**: Name, org_id, start_at, end_at, timezone, status (draft)
- **Read**: List schedules with filters (status, date range), detail view
- **Update**: Modify all fields except id, org_id; update timestamp
- **Delete**: Soft delete; only draft status; requires confirmation

### FR2: Activity Management

- Activities belong to a schedule (cascade delete)
- Fields: type, start_at, end_at, assigned users/roles, notes
- Validation: end_at > start_at, within schedule bounds

### FR3: Constraint Engine

- Constraints are org-level or schedule-level
- Types: min_hours_between_shifts, max_consecutive_days, required_rest_period
- Validation runs on save; violations block approval unless overridden

### FR4: Approval Workflow

- Status transitions: draft → pending → approved/rejected
- Only authorized roles can approve (RBAC)
- Rejection requires reason text
- Approved schedules require re-approval if modified

### FR5: Notification System

- Triggers: schedule_approved, schedule_updated, activity_assigned
- Channels: email, SMS (Twilio), push (future)
- Throttling: max 1 notification per user per schedule per hour
- Delivery tracking: sent, delivered, failed, bounced

### FR6: Audit Logging

- Log all mutations with: actor_id, action, entity, payload, timestamp
- Immutable (append-only)
- Queryable by entity, actor, date range

## Non-Functional Requirements

### Performance

| Metric | Target |
|--------|--------|
| API response time (P95) | < 200ms |
| Schedule list load | < 500ms for 100 schedules |
| Notification queue processing | < 5s from trigger to send |

### Security

- All endpoints require authentication
- Tenant isolation on all queries
- RBAC for create/edit/approve/delete
- PII handling for notification content

### Observability

- Structured logging with correlation IDs
- OpenTelemetry tracing for API calls
- Metrics: request rate, error rate, latency histograms
- Alerts: error rate > 1%, P95 latency > 500ms

### Reliability

- Transactional outbox for notifications
- Idempotent notification sending
- Retry with exponential backoff for failed sends

## UX Flows

### Primary Flows

1. **Schedule List** → Filter/sort → Select schedule → Detail view
2. **Create Schedule** → Form → Add activities → Save draft → Submit
3. **Approve Schedule** → Review → Approve/Reject → Notifications sent
4. **Notification Preview** → Select recipients → Preview → Confirm send

### States

| State | Description | Actions Available |
|-------|-------------|-------------------|
| Empty | No schedules | Create new |
| Loading | Fetching data | Skeleton UI |
| List | Schedules displayed | Filter, sort, select |
| Detail | Single schedule view | Edit, approve, notify |
| Error | API failure | Retry, contact support |

## API Contracts

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/schedules` | List schedules with pagination |
| POST | `/v1/schedules` | Create schedule |
| GET | `/v1/schedules/:id` | Get schedule detail |
| PATCH | `/v1/schedules/:id` | Update schedule |
| DELETE | `/v1/schedules/:id` | Soft delete schedule |
| POST | `/v1/schedules/:id/submit` | Submit for approval |
| POST | `/v1/schedules/:id/approve` | Approve schedule |
| POST | `/v1/schedules/:id/reject` | Reject schedule |
| GET | `/v1/schedules/:id/activities` | List activities |
| POST | `/v1/schedules/:id/activities` | Create activity |
| POST | `/v1/schedules/:id/notify` | Send notifications |

### Request/Response Examples

See [Backend PRD](./backend-prd-home.md) for detailed schemas.

## Data Model Summary

See [Database PRD](./database-prd.md) for complete schema.

Key tables:
- `schedules` — Schedule header
- `schedule_activities` — Activities within schedules
- `constraints` — Org/schedule-level constraints
- `notifications` — Notification queue and history
- `audit_logs` — Change audit trail

## Telemetry and Alerts

### Events

| Event | Properties | Trigger |
|-------|------------|---------|
| `schedule.created` | schedule_id, org_id | Schedule saved |
| `schedule.approved` | schedule_id, approver_id | Approval completed |
| `schedule.notification.sent` | schedule_id, channel, recipient_count | Notifications dispatched |
| `constraint.violation` | schedule_id, constraint_type | Validation failure |

### Alerts

| Alert | Condition | Severity |
|-------|-----------|----------|
| High error rate | Error rate > 1% for 5 min | Warning |
| API latency spike | P95 > 500ms for 5 min | Warning |
| Notification failures | Failure rate > 5% | Critical |
| Queue backlog | > 1000 pending notifications | Warning |

## Acceptance Criteria

### MVP Release Checklist

- [ ] Create/read/update/delete schedules
- [ ] Add/edit/remove activities
- [ ] Constraint validation with override
- [ ] Approval workflow (submit → approve/reject)
- [ ] Email notifications on approval
- [ ] Audit log for all mutations
- [ ] RBAC enforced on all endpoints
- [ ] Mobile-responsive list and detail views
- [ ] Error handling with user-friendly messages
- [ ] Performance targets met

## Risks and Assumptions

### Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Complex constraint rules | High dev effort | Start with 3 basic constraints |
| Notification delivery failures | User confusion | Implement retry + status visibility |
| AI generation quality | User trust issues | Review-first workflow |

### Assumptions

- Users have org accounts with roles assigned
- Twilio account configured for SMS
- Redis available for queue processing
- OpenAI API access for AI features (phase 2)

## Open Questions

1. Should schedules support versioning (keep history of approved versions)?
2. What is the maximum number of activities per schedule?
3. Should we support recurring schedules?
4. Integration priority: Google Calendar vs Outlook vs both?

<!-- TODO: Resolve open questions with stakeholders -->
