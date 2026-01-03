# TimeClockFlow Frontend PRD — Home

> **Last updated:** 2026-01-03  
> **Status:** Draft

## Objectives

1. Provide instant access to clock in/out functionality
2. Display clear shift status and duration
3. Surface anomalies requiring attention
4. Enable quick access to timesheet history
5. Work seamlessly offline

## Information Architecture

```
/timeclockflow (Home)
├── Clock Widget
│   ├── Status indicator
│   ├── Shift timer
│   ├── Primary action button
│   └── Break controls
├── Anomaly Banner (conditional)
├── Today's Summary Card
├── Quick Actions
│   ├── View Timesheet
│   └── Settings
└── Offline Indicator (conditional)
```

## Navigation

| From | To | Trigger |
|------|----|---------|
| Dashboard | TimeClockFlow Home | Click tile or nav link |
| Home | Timesheet | Click "View Timesheet" |
| Home | Anomaly Detail | Click anomaly banner |
| Anywhere | Home | Bottom nav or back |

## Primary Widgets

### Clock Widget

**Clocked Out State:**
```
┌─────────────────────────────────┐
│    ○ Ready to Clock In          │
│                                 │
│   ┌─────────────────────────┐   │
│   │      🟢 CLOCK IN        │   │
│   └─────────────────────────┘   │
│                                 │
│   Last shift: Yesterday, 8h 15m │
└─────────────────────────────────┘
```

**Clocked In State:**
```
┌─────────────────────────────────┐
│    ● Clocked In                 │
│    Started 7:00 AM              │
│                                 │
│         08:47:32                │
│         Current shift           │
│                                 │
│   ┌─────────────────────────┐   │
│   │      🔴 CLOCK OUT       │   │
│   └─────────────────────────┘   │
│                                 │
│   ┌───────────┐ ┌───────────┐   │
│   │Start Break│ │  Details  │   │
│   └───────────┘ └───────────┘   │
└─────────────────────────────────┘
```

**On Break State:**
```
┌─────────────────────────────────┐
│    ◐ On Break                   │
│    Break started 12:00 PM       │
│                                 │
│         00:25:00                │
│         Break duration          │
│                                 │
│   ┌─────────────────────────┐   │
│   │     🟠 END BREAK        │   │
│   └─────────────────────────┘   │
└─────────────────────────────────┘
```

### Anomaly Banner

Display when unresolved anomalies exist:

```
┌─────────────────────────────────┐
│ ⚠️ 1 issue needs your attention │
│ Missing clock out from Jan 2    │
│                          [View] │
└─────────────────────────────────┘
```

**Behavior:**
- Tap opens anomaly resolution sheet
- Dismiss temporarily (reappears next session)
- Badge persists in nav until resolved

### Today's Summary

```
┌─────────────────────────────────┐
│ Today                   Jan 3   │
├─────────────────────────────────┤
│ Clocked in      7:00 AM         │
│ Break taken     30 min          │
│ Time worked     4h 30m          │
│ Location        Site A ✓        │
└─────────────────────────────────┘
```

### Offline Indicator

When offline:
```
┌─────────────────────────────────┐
│ 📴 Offline - Changes will sync  │
└─────────────────────────────────┘
```

## Notifications

### In-App Notifications

| Trigger | Message | Action |
|---------|---------|--------|
| Clock in success | "Clocked in at 7:00 AM" | Dismiss |
| Clock out success | "Shift complete: 8h 15m" | View summary |
| Anomaly detected | "Issue detected with your timesheet" | View anomaly |
| Sync complete | "2 entries synced" | Dismiss |

### Push Notifications

Managed by reminder system. User can configure in settings.

## Error States

### GPS Permission Denied

```
┌─────────────────────────────────┐
│ 📍 Location access needed       │
│                                 │
│ Enable location to verify your  │
│ clock in/out at the job site.   │
│                                 │
│ [Enable Location] [Skip]        │
└─────────────────────────────────┘
```

### Network Error

```
┌─────────────────────────────────┐
│ ❌ Couldn't sync your entry     │
│                                 │
│ Your clock in was saved and     │
│ will sync when you're online.   │
│                                 │
│ [Retry] [Continue Offline]      │
└─────────────────────────────────┘
```

### Already Clocked In

```
┌─────────────────────────────────┐
│ ℹ️ You're already clocked in    │
│                                 │
│ You clocked in at 7:00 AM.      │
│ Clock out first to start a      │
│ new shift.                      │
│                                 │
│ [View Shift] [Dismiss]          │
└─────────────────────────────────┘
```

## Loading States

### Initial Load

- Show skeleton for clock widget
- Pulse animation on timer area
- Disable buttons during load

### Action Processing

- Button shows spinner
- Disable other actions
- Show progress toast on success

## Empty States

### No Entries Today

```
No time entries today
Clock in to start tracking your shift.
```

### No Anomalies

Anomaly banner hidden (default state).

## Accessibility

| Requirement | Implementation |
|-------------|----------------|
| Button size | 56x56px for primary actions |
| Touch feedback | Haptic on clock in/out |
| Screen reader | "Clock in button, double tap to start shift" |
| Color blind | Use icons + text, not color alone |
| High contrast | Support system high contrast mode |

## Performance

| Metric | Target |
|--------|--------|
| Initial render | < 1s |
| Clock action | < 300ms (optimistic UI) |
| Offline storage | < 2MB |
| Background sync | Within 30s of connectivity |

## Tracking Events

| Event | Properties |
|-------|------------|
| `timeclockflow.home.viewed` | `has_active_shift`, `anomaly_count` |
| `timeclockflow.clock_in.tapped` | `source` |
| `timeclockflow.clock_in.success` | `duration_ms`, `has_gps` |
| `timeclockflow.clock_out.tapped` | |
| `timeclockflow.clock_out.confirmed` | `shift_duration_minutes` |
| `timeclockflow.break.started` | |
| `timeclockflow.break.ended` | `break_duration_minutes` |
| `timeclockflow.anomaly.viewed` | `anomaly_type` |
| `timeclockflow.offline.action` | `action_type` |

## Responsive Design

| Breakpoint | Layout |
|------------|--------|
| Mobile (< 640px) | Full width, stacked layout |
| Tablet (640-1024px) | Centered widget, 480px max |
| Desktop (> 1024px) | Left panel, 400px fixed |

## Theming

Use existing design tokens:
- Status colors: `--color-success`, `--color-warning`, `--color-danger`
- Timer font: `--font-mono` for fixed-width digits
- Button sizing: `--button-lg` for primary actions
