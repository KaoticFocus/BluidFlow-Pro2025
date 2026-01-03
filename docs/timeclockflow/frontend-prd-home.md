# PRD — TimeClockFlow Home Screen

## Overview
Implement /timeclockflow home with role‑aware views: employee timesheet (self) and manager dashboard (team anomalies/approvals). Mobile‑first, no 360px overflow.

## Routes & Files
- Web (Next.js):
  - apps/web/src/app/timeclockflow/page.tsx (home)
  - apps/web/src/app/timeclockflow/days/[date]/page.tsx (manager day detail)
- Mobile (Expo):
  - apps/mobile/src/screens/ClockScreen.tsx
  - apps/mobile/src/screens/TimesheetScreen.tsx

## Filters & Query Params (web)
- date: YYYY‑MM‑DD (default today)
- employeeId: me|uuid (RBAC; managers may select team members)
- status: anomalies|all (default anomalies for manager)

## UX Requirements
- Mobile‑first card list
  - Employee (self): big clock CTA, today’s spans, break toggles, reminder hint
  - Manager: anomaly list (type, severity, status), open spans, quick resolve
- Actions
  - Clock in/out/break (mobile) — forwards to POST /time/clock
  - Resolve anomaly — POST /time/anomalies/:id/resolve { decision, note? }
  - Preferences (self): link to /time/reminders/prefs

## RBAC
- Field: view self, clock actions, view own anomalies, edit own preferences
- Manager/Owner: view team day, resolve anomalies, configure rules

## Accessibility & Mobile
- Tap targets ≥ 44×44; safe‑area padding; 100dvh sections where applicable
- No horizontal scroll at 360px; keyboard navigable with visible focus states

## Telemetry
- PostHog: clock_in, clock_out, anomaly_resolved, reminder_pref_updated
- OTEL: time.home.viewed, time.day.fetch

## Performance Targets
- TTI < 2s on mid‑tier mobile; Lighthouse Mobile Perf ≥ 80, A11y ≥ 90

## Acceptance Criteria
- Self view shows clock state and today’s spans; actions wired to API
- Manager view lists anomalies and supports resolve
- Deep links: /timeclockflow/days/2026‑01‑05 opens that day; employee filter respected by role
- Error handling is friendly; actions idempotent and audited