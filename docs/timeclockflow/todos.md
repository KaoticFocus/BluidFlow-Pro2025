# TimeClockFlow — Engineering TODOs

> **Last updated:** 2026-01-03

This document tracks outstanding engineering work for TimeClockFlow. Items are grouped by area and prioritized.

## Legend

- 🔴 **P0** — Critical for MVP launch
- 🟠 **P1** — Important, do soon after MVP
- 🟡 **P2** — Nice to have
- ⬜ Not started
- 🔄 In progress
- ✅ Done

---

## API

### Core Endpoints

| Priority | Status | Task | Owner |
|----------|--------|------|-------|
| 🔴 | ⬜ | Implement POST /v1/timeclock/clock-in | TBD |
| 🔴 | ⬜ | Implement POST /v1/timeclock/clock-out | TBD |
| 🔴 | ⬜ | Implement GET /v1/timeclock/status | TBD |
| 🔴 | ⬜ | Implement POST /v1/timeclock/break/start | TBD |
| 🔴 | ⬜ | Implement POST /v1/timeclock/break/end | TBD |
| 🟠 | ⬜ | Implement GET /v1/timeclock/entries | TBD |
| 🟠 | ⬜ | Implement PATCH /v1/timeclock/entries/:id | TBD |
| 🟠 | ⬜ | Implement GET /v1/timeclock/anomalies | TBD |
| 🟠 | ⬜ | Implement PATCH /v1/timeclock/anomalies/:id | TBD |

### Validation & Business Logic

| Priority | Status | Task | Owner |
|----------|--------|------|-------|
| 🔴 | ⬜ | Add Zod schemas for all endpoints | TBD |
| 🔴 | ⬜ | Implement sequential entry validation | TBD |
| 🔴 | ⬜ | Add timestamp bounds checking | TBD |
| 🟠 | ⬜ | Implement geofence validation | TBD |
| 🟠 | ⬜ | Add rate limiting per user | TBD |

### Authentication & Authorization

| Priority | Status | Task | Owner |
|----------|--------|------|-------|
| 🔴 | ⬜ | Apply auth middleware to all routes | TBD |
| 🔴 | ⬜ | Implement tenant isolation | TBD |
| 🟠 | ⬜ | Add supervisor role permissions | TBD |
| 🟠 | ⬜ | Implement entry access control | TBD |

---

## Frontend

### Clock Widget

| Priority | Status | Task | Owner |
|----------|--------|------|-------|
| 🔴 | ⬜ | Create ClockWidget component | TBD |
| 🔴 | ⬜ | Implement clock-in button with GPS capture | TBD |
| 🔴 | ⬜ | Implement clock-out with confirmation | TBD |
| 🔴 | ⬜ | Add real-time shift timer | TBD |
| 🟠 | ⬜ | Add break start/end controls | TBD |
| 🟠 | ⬜ | Implement haptic feedback | TBD |

### Status & Display

| Priority | Status | Task | Owner |
|----------|--------|------|-------|
| 🔴 | ⬜ | Create ShiftStatusCard component | TBD |
| 🔴 | ⬜ | Implement status indicator (in/out/break) | TBD |
| 🟠 | ⬜ | Add today's summary card | TBD |
| 🟠 | ⬜ | Create anomaly banner component | TBD |

### Offline Support

| Priority | Status | Task | Owner |
|----------|--------|------|-------|
| 🔴 | ⬜ | Implement local storage for pending entries | TBD |
| 🔴 | ⬜ | Add offline indicator UI | TBD |
| 🔴 | ⬜ | Implement background sync | TBD |
| 🟠 | ⬜ | Add manual sync button | TBD |
| 🟠 | ⬜ | Handle sync conflicts | TBD |

### Timesheet View

| Priority | Status | Task | Owner |
|----------|--------|------|-------|
| 🟠 | ⬜ | Create TimesheetPage component | TBD |
| 🟠 | ⬜ | Implement daily entries list | TBD |
| 🟠 | ⬜ | Add weekly summary view | TBD |
| 🟡 | ⬜ | Enable entry editing | TBD |

---

## Background Jobs

### Anomaly Detection

| Priority | Status | Task | Owner |
|----------|--------|------|-------|
| 🟠 | ⬜ | Set up BullMQ queue for anomaly detection | TBD |
| 🟠 | ⬜ | Implement missing_out detection | TBD |
| 🟠 | ⬜ | Implement duplicate_in detection | TBD |
| 🟠 | ⬜ | Implement geofence_violation detection | TBD |
| 🟡 | ⬜ | Add overtime_warning detection | TBD |

### Reminders

| Priority | Status | Task | Owner |
|----------|--------|------|-------|
| 🟠 | ⬜ | Set up reminder job scheduler | TBD |
| 🟠 | ⬜ | Implement late_clock_in reminder | TBD |
| 🟠 | ⬜ | Implement missing_clock_out reminder | TBD |
| 🟡 | ⬜ | Implement break_overrun reminder | TBD |

### Timesheet Rollup

| Priority | Status | Task | Owner |
|----------|--------|------|-------|
| 🟠 | ⬜ | Create daily rollup job | TBD |
| 🟠 | ⬜ | Implement timesheet_days aggregation | TBD |
| 🟡 | ⬜ | Add weekly/monthly rollups | TBD |

---

## Twilio Integration

| Priority | Status | Task | Owner |
|----------|--------|------|-------|
| 🟠 | ⬜ | Set up Twilio client | TBD |
| 🟠 | ⬜ | Implement sendSms function | TBD |
| 🟠 | ⬜ | Create status webhook handler | TBD |
| 🟠 | ⬜ | Implement opt-out webhook | TBD |
| 🟠 | ⬜ | Add phone verification flow | TBD |
| 🟡 | ⬜ | Implement retry logic | TBD |

---

## Infrastructure

### Database

| Priority | Status | Task | Owner |
|----------|--------|------|-------|
| 🔴 | ⬜ | Add Prisma models for time_entries | TBD |
| 🔴 | ⬜ | Add Prisma models for timesheet_days | TBD |
| 🟠 | ⬜ | Add Prisma models for anomalies | TBD |
| 🟠 | ⬜ | Add Prisma models for reminders | TBD |
| 🟠 | ⬜ | Add Prisma models for geofences | TBD |
| 🟠 | ⬜ | Create database migrations | TBD |
| 🟡 | ⬜ | Add indexes per database-prd.md | TBD |

### Observability

| Priority | Status | Task | Owner |
|----------|--------|------|-------|
| 🟠 | ⬜ | Add OpenTelemetry tracing | TBD |
| 🟠 | ⬜ | Set up Prometheus metrics | TBD |
| 🟠 | ⬜ | Configure alerts in Grafana | TBD |
| 🟡 | ⬜ | Add structured logging | TBD |

### Feature Flags

| Priority | Status | Task | Owner |
|----------|--------|------|-------|
| 🔴 | ⬜ | Add FEATURE_TIMECLOCKFLOW flag | TBD |
| 🟠 | ⬜ | Add FEATURE_TIMECLOCK_GEOFENCE flag | TBD |
| 🟠 | ⬜ | Add FEATURE_TIMECLOCK_REMINDERS flag | TBD |

---

## QA

### Unit Tests

| Priority | Status | Task | Owner |
|----------|--------|------|-------|
| 🟠 | ⬜ | Test clock-in/out service logic | TBD |
| 🟠 | ⬜ | Test anomaly detection logic | TBD |
| 🟠 | ⬜ | Test reminder throttling | TBD |
| 🟠 | ⬜ | Test ClockWidget component | TBD |

### Integration Tests

| Priority | Status | Task | Owner |
|----------|--------|------|-------|
| 🟠 | ⬜ | Test API endpoints with auth | TBD |
| 🟠 | ⬜ | Test offline sync flow | TBD |
| 🟡 | ⬜ | Test Twilio webhook handling | TBD |

### E2E Tests

| Priority | Status | Task | Owner |
|----------|--------|------|-------|
| 🟡 | ⬜ | Test full clock-in/out flow | TBD |
| 🟡 | ⬜ | Test anomaly resolution flow | TBD |
| 🟡 | ⬜ | Test offline to online sync | TBD |

---

## Documentation

| Priority | Status | Task | Owner |
|----------|--------|------|-------|
| 🟠 | ⬜ | Add OpenAPI spec for timeclock endpoints | TBD |
| 🟠 | ⬜ | Create user-facing help docs | TBD |
| 🟡 | ⬜ | Add runbook for on-call | TBD |

---

## Notes

- GPS accuracy threshold: 50 meters for geofence matching
- Consider using Web Workers for timer to prevent background throttling
- Phone number encryption: use organization-level key
- Break tracking: MVP single break type; multi-type in phase 2

<!-- 
To update this file:
1. Change status: ⬜ → 🔄 → ✅
2. Add owner initials
3. Update date at top
-->
