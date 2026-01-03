# ScheduleFlow Database PRD

> **Last updated:** 2026-01-03  
> **Status:** Draft

## Overview

This document defines the database schema for the ScheduleFlow module. All tables follow the multi-tenant pattern with `org_id` for tenant isolation.

## Tables

### schedules

Primary table for schedule headers.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, default gen_random_uuid() | Unique identifier |
| `org_id` | `uuid` | FK → organizations.id, NOT NULL | Tenant isolation |
| `name` | `varchar(255)` | NOT NULL | Schedule name |
| `description` | `text` | | Optional description |
| `start_at` | `timestamptz` | NOT NULL | Schedule start date/time |
| `end_at` | `timestamptz` | NOT NULL | Schedule end date/time |
| `timezone` | `varchar(50)` | NOT NULL, default 'UTC' | IANA timezone |
| `status` | `varchar(20)` | NOT NULL, default 'draft' | draft, pending, approved, rejected |
| `approved_by` | `uuid` | FK → users.id | Approver user ID |
| `approved_at` | `timestamptz` | | Approval timestamp |
| `rejection_reason` | `text` | | Reason if rejected |
| `created_by` | `uuid` | FK → users.id, NOT NULL | Creator user ID |
| `created_at` | `timestamptz` | NOT NULL, default now() | Creation timestamp |
| `updated_at` | `timestamptz` | NOT NULL, default now() | Last update timestamp |
| `deleted_at` | `timestamptz` | | Soft delete timestamp |

**Indexes:**
- `idx_schedules_org_id` on `org_id`
- `idx_schedules_status` on `status`
- `idx_schedules_start_at` on `start_at`
- `idx_schedules_org_status` on `(org_id, status)`

**Constraints:**
- `chk_schedules_dates` CHECK (`end_at` > `start_at`)
- `chk_schedules_status` CHECK (`status` IN ('draft', 'pending', 'approved', 'rejected'))

---

### schedule_activities

Activities within a schedule.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, default gen_random_uuid() | Unique identifier |
| `schedule_id` | `uuid` | FK → schedules.id, NOT NULL, ON DELETE CASCADE | Parent schedule |
| `activity_type` | `varchar(50)` | NOT NULL | Type (work, break, meeting, etc.) |
| `name` | `varchar(255)` | NOT NULL | Activity name |
| `description` | `text` | | Optional description |
| `start_at` | `timestamptz` | NOT NULL | Activity start |
| `end_at` | `timestamptz` | NOT NULL | Activity end |
| `assigned_user_id` | `uuid` | FK → users.id | Assigned user (optional) |
| `assigned_role_id` | `uuid` | FK → roles.id | Assigned role (optional) |
| `location` | `varchar(255)` | | Location/site |
| `notes` | `text` | | Additional notes |
| `color` | `varchar(7)` | | Hex color for display |
| `sort_order` | `integer` | default 0 | Display order |
| `created_at` | `timestamptz` | NOT NULL, default now() | Creation timestamp |
| `updated_at` | `timestamptz` | NOT NULL, default now() | Last update timestamp |

**Indexes:**
- `idx_activities_schedule_id` on `schedule_id`
- `idx_activities_assigned_user` on `assigned_user_id`
- `idx_activities_start_at` on `start_at`

**Constraints:**
- `chk_activities_dates` CHECK (`end_at` > `start_at`)

---

### constraints

Scheduling constraints at org or schedule level.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, default gen_random_uuid() | Unique identifier |
| `org_id` | `uuid` | FK → organizations.id, NOT NULL | Tenant isolation |
| `schedule_id` | `uuid` | FK → schedules.id, ON DELETE CASCADE | Optional schedule-specific |
| `name` | `varchar(100)` | NOT NULL | Constraint name |
| `type` | `varchar(50)` | NOT NULL | Constraint type |
| `payload` | `jsonb` | NOT NULL, default '{}' | Constraint parameters |
| `is_active` | `boolean` | NOT NULL, default true | Enable/disable |
| `severity` | `varchar(20)` | default 'warning' | warning, error, info |
| `created_at` | `timestamptz` | NOT NULL, default now() | Creation timestamp |
| `updated_at` | `timestamptz` | NOT NULL, default now() | Last update timestamp |

**Constraint Types:**
- `min_hours_between_shifts` — Minimum rest between shifts
- `max_consecutive_days` — Maximum work days in a row
- `required_break_duration` — Minimum break time
- `max_daily_hours` — Maximum hours per day
- `blackout_dates` — Dates when scheduling is prohibited

**Payload Examples:**

```json
// min_hours_between_shifts
{ "min_hours": 8 }

// max_consecutive_days
{ "max_days": 6 }

// blackout_dates
{ "dates": ["2026-01-01", "2026-07-04"] }
```

**Indexes:**
- `idx_constraints_org_id` on `org_id`
- `idx_constraints_schedule_id` on `schedule_id`
- `idx_constraints_type` on `type`

---

### notifications

Notification queue and delivery history.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, default gen_random_uuid() | Unique identifier |
| `org_id` | `uuid` | FK → organizations.id, NOT NULL | Tenant isolation |
| `schedule_id` | `uuid` | FK → schedules.id, ON DELETE SET NULL | Related schedule |
| `recipient_id` | `uuid` | FK → users.id, NOT NULL | Target user |
| `channel` | `varchar(20)` | NOT NULL | email, sms, push |
| `template_key` | `varchar(50)` | NOT NULL | Template identifier |
| `subject` | `varchar(255)` | | Email subject |
| `body` | `text` | | Rendered content |
| `payload` | `jsonb` | default '{}' | Template variables |
| `status` | `varchar(20)` | NOT NULL, default 'pending' | pending, sent, delivered, failed |
| `scheduled_for` | `timestamptz` | | Delayed send time |
| `sent_at` | `timestamptz` | | Actual send time |
| `delivered_at` | `timestamptz` | | Delivery confirmation |
| `error_message` | `text` | | Error details if failed |
| `retry_count` | `integer` | default 0 | Retry attempts |
| `idempotency_key` | `varchar(100)` | UNIQUE | Prevent duplicate sends |
| `created_at` | `timestamptz` | NOT NULL, default now() | Creation timestamp |

**Indexes:**
- `idx_notifications_org_id` on `org_id`
- `idx_notifications_schedule_id` on `schedule_id`
- `idx_notifications_recipient` on `recipient_id`
- `idx_notifications_status` on `status`
- `idx_notifications_scheduled` on `scheduled_for` WHERE `status = 'pending'`

---

### audit_logs

Immutable audit trail for all schedule mutations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, default gen_random_uuid() | Unique identifier |
| `org_id` | `uuid` | FK → organizations.id, NOT NULL | Tenant isolation |
| `entity_type` | `varchar(50)` | NOT NULL | schedule, activity, constraint |
| `entity_id` | `uuid` | NOT NULL | ID of affected entity |
| `action` | `varchar(20)` | NOT NULL | create, update, delete, approve, reject |
| `actor_id` | `uuid` | FK → users.id, NOT NULL | User who performed action |
| `actor_ip` | `inet` | | Client IP address |
| `payload` | `jsonb` | NOT NULL | Before/after state |
| `created_at` | `timestamptz` | NOT NULL, default now() | Action timestamp |

**Indexes:**
- `idx_audit_logs_org_id` on `org_id`
- `idx_audit_logs_entity` on `(entity_type, entity_id)`
- `idx_audit_logs_actor` on `actor_id`
- `idx_audit_logs_created_at` on `created_at`

**Note:** This table is append-only. No UPDATE or DELETE operations allowed.

---

## Relationships

```
organizations (1) ──── (N) schedules
schedules (1) ──── (N) schedule_activities
schedules (1) ──── (N) notifications
organizations (1) ──── (N) constraints
schedules (1) ──── (N) constraints (optional)
users (1) ──── (N) schedule_activities (assigned)
users (1) ──── (N) notifications (recipient)
users (1) ──── (N) audit_logs (actor)
```

## Data Retention

| Table | Retention | Policy |
|-------|-----------|--------|
| schedules | Indefinite | Soft delete only |
| schedule_activities | With parent | Cascade delete |
| constraints | Indefinite | Can be deactivated |
| notifications | 90 days | Archive to cold storage |
| audit_logs | 7 years | Compliance requirement |

## PII Handling

| Table | PII Fields | Handling |
|-------|------------|----------|
| notifications | body, payload | Encrypt at rest; redact in logs |
| audit_logs | payload | May contain user data; encrypt at rest |

## Migration Notes

```sql
-- Example migration: Add schedules table
CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  name VARCHAR(255) NOT NULL,
  -- ... other columns
  CONSTRAINT chk_schedules_dates CHECK (end_at > start_at)
);

CREATE INDEX idx_schedules_org_id ON schedules(org_id);
CREATE INDEX idx_schedules_status ON schedules(status);
```

<!-- TODO: Generate Prisma schema from this document -->
