# TimeClockFlow — Module Overview

> **Last updated:** 2026-01-03

## Purpose and Scope

TimeClockFlow provides mobile-first time tracking for construction crews with GPS verification, anomaly detection, and automated reminders. It ensures accurate time records with immutable audit trails while supporting offline operation in the field.

### Who Uses It

- **Field Workers**: Clock in/out, track breaks
- **Crew Leads**: Review team timesheets, approve entries
- **Project Managers**: Monitor labor hours, review anomalies
- **Payroll Admins**: Export data, manage timesheet locks

## Key Capabilities

| Capability | Description |
|------------|-------------|
| **Clock In/Out** | One-tap time entry with GPS verification |
| **Break Tracking** | Start/end breaks with automatic duration calculation |
| **Geofencing** | Verify workers are at designated job sites |
| **Anomaly Detection** | AI-powered detection of missing punches, duplicates, violations |
| **Reminders** | SMS/push reminders for late clock-in or missing clock-out |
| **Timesheet Review** | Daily/weekly views with approval workflow |
| **Offline Support** | Works without internet, syncs when connected |
| **Audit Trail** | Immutable log of all time entries and modifications |

## High-Level Flows

### Clock In

```
1. Worker opens TimeClockFlow
2. Tap "Clock In" button
3. System captures timestamp + GPS coordinates
4. Validate against assigned geofences
5. If outside geofence: warn but allow with note
6. Create time_entry record (type: 'in')
7. Show confirmation with shift timer
```

### Clock Out

```
1. Worker taps "Clock Out" button
2. Confirm action (prevent accidental taps)
3. System captures timestamp + GPS
4. Calculate shift duration
5. Create time_entry record (type: 'out')
6. Update timesheet_day totals
7. Show summary: hours worked, breaks taken
```

### Break Flow

```
1. Worker taps "Start Break"
2. Create time_entry (type: 'break_start')
3. Timer shows break duration
4. Worker taps "End Break"
5. Create time_entry (type: 'break_end')
6. Calculate break duration, deduct from total
```

### Anomaly Resolution

```
1. System job runs hourly
2. Detect anomalies: missing_out, duplicate_in, geofence_violation
3. Create anomaly record
4. Notify supervisor
5. Supervisor reviews, adds resolution notes
6. Mark resolved; update timesheet if needed
```

## Documentation Links

| Document | Description |
|----------|-------------|
| [Frontend PRD (MVP)](./frontend-prd-mvp.md) | Core screens and flows |
| [Backend PRD (MVP)](./backend-prd-mvp.md) | API endpoints and jobs |
| [Database PRD](./database-prd.md) | Schema and tables |
| [Frontend PRD (Home)](./frontend-prd-home.md) | Home view UI/UX |
| [Reminders + Twilio](./reminders-twilio.md) | SMS integration |
| [TODOs](./todos.md) | Engineering task list |

## Related Documentation

- [Mobile UX Brief](../mobile/module-ux/time-clock-flow.md) — Mobile-specific patterns
- [Dashboard Integration](../dashboard/README.md) — KPI tiles

## Runbook (Operations)

### Feature Flags

| Flag | Description | Default |
|------|-------------|---------|
| `FEATURE_TIMECLOCKFLOW` | Enable/disable module | `false` |
| `FEATURE_TIMECLOCK_GEOFENCE` | Enable geofencing | `false` |
| `FEATURE_TIMECLOCK_REMINDERS` | Enable SMS reminders | `false` |
| `FEATURE_TIMECLOCK_ANOMALY` | Enable anomaly detection | `true` |

### On-Call Tips

1. **Clock not working**: Check GPS permissions, verify device time sync
2. **Reminders not sending**: Check Twilio credentials, verify opt-in status
3. **Anomalies not detecting**: Check cron job, verify Redis connection
4. **Sync failures**: Check offline queue, verify API connectivity

### Key Metrics

- `timeclockflow.clockin.count` — Clock-in rate
- `timeclockflow.anomaly.detected` — Anomaly frequency
- `timeclockflow.reminder.sent` — Reminder delivery rate
- `timeclockflow.sync.latency` — Offline sync time

### Emergency Procedures

```bash
# Disable reminders immediately
export FEATURE_TIMECLOCK_REMINDERS=false

# Pause anomaly detection
export FEATURE_TIMECLOCK_ANOMALY=false

# Force sync all pending entries
pnpm --filter @buildflow/api timeclock:force-sync
```
