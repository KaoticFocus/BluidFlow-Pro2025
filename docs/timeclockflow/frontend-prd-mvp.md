# TimeClockFlow Frontend PRD — MVP

> **Last updated:** 2026-01-03  
> **Status:** Draft

## Goals

1. Enable field workers to clock in/out with minimal friction
2. Provide clear shift status and duration visibility
3. Support break tracking with simple UI
4. Surface anomalies requiring attention
5. Work reliably offline with automatic sync

## Non-Goals (MVP)

- Manager approval workflows (phase 2)
- Advanced reporting and analytics
- Bulk time entry editing
- Calendar integrations
- Photo verification

## Core Screens

### 1. Clock Widget (Home)

**Primary View:**
- Large status indicator: "Clocked In" / "Clocked Out"
- Current shift timer (HH:MM:SS) when clocked in
- Primary action button (Clock In / Clock Out)
- Break status and button when applicable

**Layout:**
```
┌────────────────────────────────┐
│  ● Clocked In                  │
│      ───────────────           │
│      08:47:32                  │
│      Current shift             │
│                                │
│  ┌────────────────────────┐    │
│  │     CLOCK OUT          │    │
│  └────────────────────────┘    │
│                                │
│  ┌──────────┐ ┌──────────┐     │
│  │ Break    │ │ History  │     │
│  └──────────┘ └──────────┘     │
└────────────────────────────────┘
```

**States:**
- Clocked out: Green "Clock In" button
- Clocked in: Red "Clock Out" button, timer running
- On break: Amber "End Break" button, break timer

**Acceptance Criteria:**
- [ ] Display current clock status with visual indicator
- [ ] Show running timer when clocked in
- [ ] Single tap to clock in (no confirmation needed)
- [ ] Confirm before clock out (accidental tap prevention)
- [ ] GPS captured on clock in/out (with permission prompt if needed)
- [ ] Works offline; queues actions for sync

### 2. Break Controls

**Display when clocked in:**
- "Start Break" button (secondary style)
- When on break: "End Break" button + break duration timer

**Break Types (MVP):**
- Single break type (meal/rest combined)
- Future: configurable break types

**Acceptance Criteria:**
- [ ] Start break records timestamp
- [ ] Break timer shows duration
- [ ] End break calculates total break time
- [ ] Break time deducted from shift total

### 3. Shift Status Card

**Information shown:**
- Clock-in time: "Started at 7:00 AM"
- Location verification: "Site A ✓" or "Location not verified ⚠"
- Break taken: "30 min break"
- Projected end: Based on standard shift length

**Acceptance Criteria:**
- [ ] Show clock-in time in local timezone
- [ ] Display location verification status
- [ ] Show break time taken
- [ ] Update in real-time

### 4. Anomalies Banner

**Display when anomalies exist:**
- Banner at top of screen
- "1 issue needs attention" with tap to expand
- List of anomaly types and resolution actions

**Anomaly Types:**
| Type | Message | Action |
|------|---------|--------|
| `missing_out` | "Missing clock out from yesterday" | Add clock-out time |
| `duplicate_in` | "Duplicate clock in detected" | Review and remove |
| `geofence_violation` | "Clock in outside job site" | Add note/justification |

**Acceptance Criteria:**
- [ ] Banner visible when unresolved anomalies exist
- [ ] Tapping opens anomaly detail sheet
- [ ] Can add notes/resolution from mobile
- [ ] Badge count on navigation

### 5. Timesheet View

**Daily View:**
- List of time entries for selected day
- Total hours, breaks, net time
- Edit capability for own entries (before lock)

**Weekly Summary:**
- Days as cards showing total hours
- Week total at top
- Tap day to see detail

**Acceptance Criteria:**
- [ ] Show entries grouped by day
- [ ] Display totals (gross, breaks, net)
- [ ] Allow editing entries before timesheet lock
- [ ] Visual indicator for locked days

## Edge Cases

### Offline Flow

1. User clocks in while offline
2. Entry saved to local storage with pending flag
3. UI shows "Pending sync" indicator
4. When online: automatic sync
5. If sync fails: retry with backoff
6. Show sync status in settings

**Acceptance Criteria:**
- [ ] Clock in/out works without network
- [ ] Pending entries show sync status
- [ ] Automatic retry on connectivity
- [ ] User can force sync manually

### Late Entries

If user forgets to clock out:
1. Next clock in triggers "Missing clock out" flow
2. Prompt: "Add clock out for yesterday?"
3. User enters approximate time
4. Creates entry with `source: 'manual'`
5. Flags for supervisor review

### Timezone Handling

- All timestamps stored as UTC
- Display in user's local timezone
- Handle timezone changes gracefully
- Show timezone in timesheet view

## Accessibility

| Requirement | Implementation |
|-------------|----------------|
| Touch targets | All buttons ≥ 44x44px |
| Color contrast | Status colors meet WCAG AA |
| Screen reader | Button labels descriptive |
| Haptic feedback | Vibrate on clock in/out |

## Performance

| Metric | Target |
|--------|--------|
| Time to interactive | < 2s |
| Clock action response | < 200ms |
| Offline storage | < 5MB |
| Battery impact | Minimal (GPS on-demand only) |

## Tracking Events

| Event | Properties |
|-------|------------|
| `timeclock.viewed` | |
| `timeclock.clock_in` | `source`, `has_gps`, `geofence_match` |
| `timeclock.clock_out` | `shift_duration`, `break_duration` |
| `timeclock.break_start` | |
| `timeclock.break_end` | `break_duration` |
| `timeclock.anomaly_viewed` | `anomaly_type` |
| `timeclock.offline_sync` | `entry_count`, `success` |
