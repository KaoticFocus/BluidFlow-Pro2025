# Frontend PRD — TimeClockFlow MVP (Reminders + Anomaly Detection)

## Overview
Deliver mobile-first time capture with clock in/out, a timesheet day view, anomaly review, and reminder preferences. Manager web views for approvals and anomalies.

## Screens
- Mobile (Expo)
  - ClockScreen: big clock button (in/out), geofence notice, current status, last punch
  - TimesheetScreen: day list (entries, breaks), anomalies list + resolve action
  - ReminderPrefs: per-user settings (timezone, quiet hours, channels)
- Web
  - /timeclockflow: manager dashboard (open spans, anomalies, approvals)
  - /timeclockflow/days/[date]: day details for team; resolve anomalies

## UX & Mobile-first
- Large tap targets (≥44×44), safe-area padding, full-screen sheets for dialogs
- Offline-tolerant UI optional; optimistic updates for resolves

## Data & State
- APIs: /time/clock, /time/days/:date, /time/anomalies/:id/resolve, /time/reminders/prefs
- tanstack-query with background refetch; live update indicators for open spans

## Accessibility
- Clear labels on clock actions; announce state changes; keyboard-accessible manager views

## Telemetry
- clock_in, clock_out, anomaly_resolved, reminder_pref_updated

## Acceptance
- Users can clock in/out on mobile; managers see team day and resolve anomalies; reminder prefs editable