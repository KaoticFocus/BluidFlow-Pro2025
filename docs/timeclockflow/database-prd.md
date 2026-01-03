# TimeClockFlow Database PRD

> **Last updated:** 2026-01-03  
> **Status:** Draft

## Overview

This document defines the database schema for TimeClockFlow. All tables use `org_id` for tenant isolation and follow the established conventions.

## Tables

### time_entries

Individual clock events (in, out, break start, break end).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, default gen_random_uuid() | Unique identifier |
| `user_id` | `uuid` | FK → users.id, NOT NULL | Worker user ID |
| `org_id` | `uuid` | FK → organizations.id, NOT NULL | Tenant isolation |
| `type` | `varchar(20)` | NOT NULL | in, out, break_start, break_end |
| `at` | `timestamptz` | NOT NULL | Event timestamp |
| `source` | `varchar(20)` | NOT NULL, default 'mobile' | mobile, web, manual, import |
| `geo` | `jsonb` | | GPS coordinates |
| `geofence_id` | `uuid` | FK → geofences.id | Matched geofence (if any) |
| `notes` | `text` | | Optional notes |
| `is_synced` | `boolean` | default true | False for offline entries pending sync |
| `synced_at` | `timestamptz` | | When entry was synced |
| `created_at` | `timestamptz` | NOT NULL, default now() | Creation timestamp |
| `updated_at` | `timestamptz` | NOT NULL, default now() | Last update |
| `deleted_at` | `timestamptz` | | Soft delete |

**Geo JSON structure:**
```json
{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "accuracy": 10,
  "altitude": null,
  "heading": null,
  "speed": null
}
```

**Indexes:**
- `idx_time_entries_user_id` on `user_id`
- `idx_time_entries_org_id` on `org_id`
- `idx_time_entries_at` on `at`
- `idx_time_entries_user_date` on `(user_id, date(at))`
- `idx_time_entries_type` on `type`

**Constraints:**
- `chk_time_entries_type` CHECK (`type` IN ('in', 'out', 'break_start', 'break_end'))
- `chk_time_entries_source` CHECK (`source` IN ('mobile', 'web', 'manual', 'import'))

---

### timesheet_days

Daily aggregated time data per user.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, default gen_random_uuid() | Unique identifier |
| `user_id` | `uuid` | FK → users.id, NOT NULL | Worker user ID |
| `org_id` | `uuid` | FK → organizations.id, NOT NULL | Tenant isolation |
| `date` | `date` | NOT NULL | Calendar date (local) |
| `total_seconds` | `integer` | default 0 | Total work seconds |
| `break_seconds` | `integer` | default 0 | Total break seconds |
| `net_seconds` | `integer` | default 0 | total - breaks |
| `entry_count` | `integer` | default 0 | Number of entries |
| `status` | `varchar(20)` | default 'open' | open, submitted, approved, locked |
| `submitted_at` | `timestamptz` | | When submitted for approval |
| `approved_by` | `uuid` | FK → users.id | Approver |
| `approved_at` | `timestamptz` | | Approval timestamp |
| `locked_at` | `timestamptz` | | When locked for payroll |
| `notes` | `text` | | Day-level notes |
| `created_at` | `timestamptz` | NOT NULL, default now() | |
| `updated_at` | `timestamptz` | NOT NULL, default now() | |

**Indexes:**
- `idx_timesheet_days_user_date` UNIQUE on `(user_id, date)`
- `idx_timesheet_days_org_date` on `(org_id, date)`
- `idx_timesheet_days_status` on `status`

---

### anomalies

Detected time entry anomalies requiring attention.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, default gen_random_uuid() | Unique identifier |
| `user_id` | `uuid` | FK → users.id, NOT NULL | Affected user |
| `org_id` | `uuid` | FK → organizations.id, NOT NULL | Tenant isolation |
| `entry_id` | `uuid` | FK → time_entries.id | Related entry |
| `type` | `varchar(30)` | NOT NULL | Anomaly type |
| `severity` | `varchar(10)` | default 'warning' | info, warning, error |
| `message` | `text` | | Human-readable description |
| `payload` | `jsonb` | default '{}' | Additional context |
| `detected_at` | `timestamptz` | NOT NULL, default now() | When detected |
| `resolved_at` | `timestamptz` | | When resolved |
| `resolved_by` | `uuid` | FK → users.id | Who resolved |
| `resolution_action` | `varchar(30)` | | Action taken |
| `resolution_notes` | `text` | | Resolution explanation |
| `created_at` | `timestamptz` | NOT NULL, default now() | |

**Anomaly Types:**
- `missing_out` — Clock in without corresponding clock out
- `missing_in` — Clock out without prior clock in
- `duplicate_in` — Multiple clock ins without clock out
- `geofence_violation` — Entry outside allowed geofence
- `overtime_warning` — Approaching or exceeding overtime limit
- `long_break` — Break exceeds allowed duration
- `short_shift` — Shift shorter than minimum

**Indexes:**
- `idx_anomalies_user_id` on `user_id`
- `idx_anomalies_org_id` on `org_id`
- `idx_anomalies_type` on `type`
- `idx_anomalies_pending` on `(org_id, resolved_at)` WHERE `resolved_at IS NULL`

---

### reminders

Scheduled reminder rules per user.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, default gen_random_uuid() | Unique identifier |
| `user_id` | `uuid` | FK → users.id, NOT NULL | Target user |
| `org_id` | `uuid` | FK → organizations.id, NOT NULL | Tenant isolation |
| `rule_key` | `varchar(50)` | NOT NULL | Reminder type |
| `channel` | `varchar(20)` | NOT NULL | sms, push, email |
| `phone_number` | `varchar(20)` | | For SMS (encrypted) |
| `payload` | `jsonb` | default '{}' | Rule configuration |
| `next_run_at` | `timestamptz` | | Next scheduled run |
| `last_run_at` | `timestamptz` | | Last execution |
| `last_sent_at` | `timestamptz` | | Last notification sent |
| `is_active` | `boolean` | default true | Enable/disable |
| `opt_in_at` | `timestamptz` | | When user opted in |
| `opt_out_at` | `timestamptz` | | When user opted out |
| `created_at` | `timestamptz` | NOT NULL, default now() | |
| `updated_at` | `timestamptz` | NOT NULL, default now() | |

**Rule Keys:**
- `late_clock_in` — Remind if not clocked in by expected time
- `missing_clock_out` — Remind if no clock out by end of shift
- `break_overrun` — Remind if break exceeds limit
- `daily_summary` — End-of-day summary

**Payload Example:**
```json
{
  "expectedClockIn": "07:00",
  "gracePeriodMinutes": 15,
  "timezone": "America/New_York"
}
```

**Indexes:**
- `idx_reminders_user_id` on `user_id`
- `idx_reminders_next_run` on `next_run_at` WHERE `is_active = true`

---

### geofences

Geographic boundaries for location verification.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, default gen_random_uuid() | Unique identifier |
| `org_id` | `uuid` | FK → organizations.id, NOT NULL | Tenant isolation |
| `name` | `varchar(100)` | NOT NULL | Geofence name |
| `description` | `text` | | Optional description |
| `geometry` | `jsonb` | NOT NULL | GeoJSON polygon/circle |
| `radius_meters` | `integer` | | For circle geofences |
| `active_hours` | `jsonb` | | When geofence is active |
| `is_active` | `boolean` | default true | Enable/disable |
| `created_at` | `timestamptz` | NOT NULL, default now() | |
| `updated_at` | `timestamptz` | NOT NULL, default now() | |

**Geometry (Circle):**
```json
{
  "type": "Circle",
  "center": { "latitude": 40.7128, "longitude": -74.0060 },
  "radius": 100
}
```

**Geometry (Polygon):**
```json
{
  "type": "Polygon",
  "coordinates": [
    [[-74.01, 40.71], [-74.00, 40.71], [-74.00, 40.72], [-74.01, 40.72], [-74.01, 40.71]]
  ]
}
```

**Active Hours:**
```json
{
  "monday": { "start": "06:00", "end": "18:00" },
  "tuesday": { "start": "06:00", "end": "18:00" },
  ...
}
```

**Indexes:**
- `idx_geofences_org_id` on `org_id`
- `idx_geofences_active` on `(org_id, is_active)` WHERE `is_active = true`

---

## Relationships

```
users (1) ──── (N) time_entries
users (1) ──── (N) timesheet_days
users (1) ──── (N) anomalies
users (1) ──── (N) reminders
organizations (1) ──── (N) time_entries
organizations (1) ──── (N) geofences
time_entries (N) ──── (1) geofences (optional)
time_entries (1) ──── (N) anomalies
```

## Data Retention

| Table | Retention | Policy |
|-------|-----------|--------|
| time_entries | 2 years | Archive to cold storage |
| timesheet_days | 7 years | Payroll compliance |
| anomalies | 1 year | Archive resolved anomalies |
| reminders | Indefinite | Soft delete on opt-out |
| geofences | Indefinite | Soft delete |

## PII Handling

| Table | PII Fields | Handling |
|-------|------------|----------|
| time_entries | geo | Encrypt at rest; hash for analytics |
| reminders | phone_number | Encrypt at rest; mask in logs |

## Performance Considerations

- Partition `time_entries` by month for large deployments
- Consider TimescaleDB for time-series optimizations
- Index on `(user_id, date(at))` critical for daily queries
- Materialized views for weekly/monthly rollups

## Migration Example

```sql
-- Add time_entries table
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  org_id UUID NOT NULL REFERENCES organizations(id),
  type VARCHAR(20) NOT NULL,
  at TIMESTAMPTZ NOT NULL,
  source VARCHAR(20) NOT NULL DEFAULT 'mobile',
  geo JSONB,
  geofence_id UUID REFERENCES geofences(id),
  notes TEXT,
  is_synced BOOLEAN DEFAULT true,
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  
  CONSTRAINT chk_time_entries_type CHECK (type IN ('in', 'out', 'break_start', 'break_end'))
);

CREATE INDEX idx_time_entries_user_date ON time_entries(user_id, date(at));
CREATE INDEX idx_time_entries_org_id ON time_entries(org_id);
```
