# TimeClockFlow Backend PRD — MVP

> **Last updated:** 2026-01-03  
> **Status:** Draft

## Overview

TimeClockFlow backend handles time entry creation, anomaly detection, and reminder scheduling. Built on Hono with BullMQ for background jobs.

## Endpoints

### POST /v1/timeclock/clock-in

Record a clock-in event.

**Request:**
```json
{
  "timestamp": "2026-01-03T07:00:00Z",
  "geo": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "accuracy": 10
  },
  "source": "mobile",
  "notes": "Starting early today"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "type": "in",
  "at": "2026-01-03T07:00:00Z",
  "geofenceMatch": {
    "matched": true,
    "geofenceId": "uuid",
    "geofenceName": "Site A"
  }
}
```

**Validation:**
- `timestamp` must be within ±15 minutes of server time
- `geo` optional but recommended
- Cannot clock in if already clocked in (returns 409)

**Business Rules:**
- Check for existing open shift (no clock-out)
- Validate against geofences if enabled
- Create `time_entry` with type 'in'

---

### POST /v1/timeclock/clock-out

Record a clock-out event.

**Request:**
```json
{
  "timestamp": "2026-01-03T15:30:00Z",
  "geo": { ... },
  "source": "mobile"
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "type": "out",
  "at": "2026-01-03T15:30:00Z",
  "shiftSummary": {
    "startAt": "2026-01-03T07:00:00Z",
    "endAt": "2026-01-03T15:30:00Z",
    "totalMinutes": 510,
    "breakMinutes": 30,
    "netMinutes": 480
  }
}
```

**Validation:**
- Must have open clock-in (returns 409 if not)
- `timestamp` must be after last clock-in

**Side Effects:**
- Create `time_entry` with type 'out'
- Update `timesheet_days` totals
- Clear any pending reminders

---

### POST /v1/timeclock/break/start

Start a break.

**Request:**
```json
{
  "timestamp": "2026-01-03T12:00:00Z"
}
```

**Validation:**
- Must be clocked in
- Cannot start break if already on break

---

### POST /v1/timeclock/break/end

End a break.

**Request:**
```json
{
  "timestamp": "2026-01-03T12:30:00Z"
}
```

**Response includes:**
```json
{
  "breakDuration": 30,
  "totalBreakToday": 30
}
```

---

### GET /v1/timeclock/status

Get current clock status.

**Response:**
```json
{
  "status": "clocked_in",
  "currentShift": {
    "startAt": "2026-01-03T07:00:00Z",
    "durationMinutes": 180,
    "breakMinutes": 0,
    "onBreak": false
  },
  "lastEntry": {
    "id": "uuid",
    "type": "in",
    "at": "2026-01-03T07:00:00Z"
  },
  "anomalyCount": 1
}
```

---

### GET /v1/timeclock/entries

List time entries with filters.

**Query Params:**
| Param | Type | Description |
|-------|------|-------------|
| `from` | date | Start date (default: today) |
| `to` | date | End date (default: today) |
| `type` | string | Filter by type (in/out/break_start/break_end) |

---

### GET /v1/timeclock/anomalies

List anomalies for current user.

**Query Params:**
| Param | Type | Description |
|-------|------|-------------|
| `status` | string | pending, resolved, all |
| `from` | date | Start date |
| `to` | date | End date |

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "type": "missing_out",
      "detectedAt": "2026-01-02T22:00:00Z",
      "entry": {
        "id": "uuid",
        "type": "in",
        "at": "2026-01-02T07:00:00Z"
      },
      "resolvedAt": null,
      "resolutionNotes": null
    }
  ]
}
```

---

### PATCH /v1/timeclock/anomalies/:id

Resolve an anomaly.

**Request:**
```json
{
  "action": "add_clock_out",
  "data": {
    "timestamp": "2026-01-02T16:00:00Z"
  },
  "notes": "Forgot to clock out, left at 4pm"
}
```

## Background Jobs

### Anomaly Detection Job

**Schedule:** Every hour

**Logic:**
1. Query all clock-ins from last 24h without matching clock-out
2. If clock-in > 16 hours old → create `missing_out` anomaly
3. Query duplicate clock-ins (same user, same day, < 5 min apart)
4. If found → create `duplicate_in` anomaly
5. Check geofence violations for recent entries

**Queue:** `timeclock-anomaly-detection`

```typescript
// Job payload
{
  "orgId": "uuid",
  "runType": "scheduled" | "manual"
}
```

### Reminder Job

**Schedule:** Every 5 minutes

**Logic:**
1. Query `reminders` where `next_run_at <= now()` and `is_active = true`
2. For each reminder:
   - Check if condition still applies (e.g., user still not clocked in)
   - If applies: queue notification
   - Update `last_run_at` and calculate `next_run_at`

**Queue:** `timeclock-reminders`

### Timesheet Rollup Job

**Schedule:** Daily at midnight (per timezone)

**Logic:**
1. For each org timezone, calculate yesterday's totals
2. Sum time entries into `timesheet_days`
3. Mark day as ready for review

## Validation Rules

| Rule | Description |
|------|-------------|
| No future timestamps | Entries cannot be > 5 min in future |
| No ancient timestamps | Entries cannot be > 7 days in past |
| Sequential entries | Out must follow In, Break End must follow Break Start |
| Single active shift | Only one open shift per user |
| Geofence warning | Log but allow entries outside geofence |

## Security

- All endpoints require authentication
- Tenant isolation enforced
- Users can only access own entries (except supervisors)
- Anomaly resolution logged to audit trail
- GPS data encrypted at rest

## Audit Logging

All mutations logged:
```json
{
  "entityType": "time_entry",
  "entityId": "uuid",
  "action": "create",
  "actor": "user-uuid",
  "payload": { "before": null, "after": { ... } }
}
```

## Observability

### Metrics

| Metric | Type | Labels |
|--------|------|--------|
| `timeclock_entries_total` | Counter | type, source |
| `timeclock_anomalies_total` | Counter | type |
| `timeclock_job_duration_seconds` | Histogram | job_type |
| `timeclock_geofence_violations` | Counter | |

### Alerts

| Alert | Condition | Severity |
|-------|-----------|----------|
| Anomaly spike | > 50 anomalies/hour | Warning |
| Job failure | Anomaly job fails 3x | Critical |
| High missing_out rate | > 10% of clock-ins | Warning |

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| clock-in/out | 10/min per user |
| entries list | 30/min per user |
| anomaly resolve | 20/min per user |
