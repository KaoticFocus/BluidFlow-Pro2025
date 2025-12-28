# TimeClockFlow MVP

## Feature Overview
Mobile-first timeclock with in-app reminders, visible timesheet anomaly flags, and an immutable audit view. Enables field techs to clock in/out quickly, managers to review and resolve anomalies, and both to view a complete event timeline.

## Requirements
- Roles & access
  - Field Tech/Crew Lead: self timeclock, self anomalies, self audit.
  - Owner/Manager: team dashboard, all anomalies, approve/resolve, full audit.
- Timeclock UI
  - States: Not Clocked In, Clocked In, On Break, Pending Sync (offline), Clock-Out Overdue, Location Disabled.
  - Actions: Clock In, Start Break, End Break, Clock Out; project/job select (searchable), optional note.
  - Location indicator: permission status + last fix timestamp; warn if disabled or stale (>10 min).
  - Offline UX: allow actions; queue with "Pending sync" badge; retry banner; per-action local timestamp.
- Reminders (in-app UI + preferences)
  - In-app reminder banners for: start-of-day not clocked in, end-of-day still clocked in, no break after X hours.
  - Banner actions: Snooze 15m, Dismiss, Go to Action (focus clock controls).
  - Preferences (per user; manager can set org defaults): enable/disable each reminder, set times/thresholds, channels (Push, SMS, Email) toggles.
  - Permission prompts for notifications; show current OS permission state with CTA to enable.
- Anomaly detection UI
  - Anomaly list views: My Anomalies (mobile), Team Anomalies (web).
  - Types and badges: Missing Clock-Out, Overlapping Shifts, Short Shift (<X min), Long Shift (>Y hr), Out-of-geo (if location available), No Project Assigned, Break Inconsistency.
  - Severity: Warning (amber), Critical (red).
  - Row contents: employee, date, project, type, severity, summary, status (Open, Submitted, Resolved), last updated.
  - Detail drawer/modal: timeline preview, detected issue, suggested fix, editable fields (start/end time, project, note), validation, required reviewer note on submit.
  - Actions by role:
    - Tech: Submit Correction (creates review item), Add Note.
    - Manager: Approve, Reject with reason, Edit and Approve.
- Audit
  - Per-user and per-timesheet timeline: events (Clock In/Out/Break, Edits, Reminders Sent/Interacted, Approvals), actor, source (mobile/web/system), timestamp, location snapshot, device info.
  - Diff view for edits: before/after times and project; immutable read-only.
  - Filters: employee, date range, project, event type.
- Lists and tables
  - Web: sortable, filterable tables with pagination; export CSV for Audit (client-side CSV generation).
  - Mobile: segmented tabs (Status, Anomalies, Audit); search + filter sheets.
- Empty, loading, and error states
  - Empty: "No anomalies detected" with explainer; "No audit events for selected range."
  - Loading skeletons for lists and timeline; retry on network errors.
- Responsive & accessibility
  - Mobile: sticky primary action button; large touch targets; one-handed reach.
  - Desktop: 2-column layout (filters left, content right).
  - WCAG AA: focus states, keyboard operability, semantic headings, ARIA for banners/dialogs, color-safe severity badges.

## Component Architecture (proposed paths)
- apps/mobile/features/timeclock/TimeClockScreen.tsx
- apps/mobile/features/timeclock/AnomaliesScreen.tsx
- apps/mobile/features/timeclock/AuditScreen.tsx
- apps/web/app/timeclock/page.tsx (Team Status)
- apps/web/app/timeclock/anomalies/page.tsx
- apps/web/app/timeclock/audit/page.tsx
- packages/ui/timeclock/TimeClockWidget.tsx
- packages/ui/timeclock/ReminderBanner.tsx
- packages/ui/timeclock/AnomalyTable.tsx
- packages/ui/timeclock/AnomalyDetailDrawer.tsx
- packages/ui/audit/AuditTimeline.tsx
- packages/ui/common/LocationIndicator.tsx

## User Stories
- As a field tech, I can clock in with project selection in under 2 taps and see confirmation with current elapsed time.
- As a field tech, I receive a banner if I forgot to clock out near day end and can clock out directly from it.
- As a manager, I can see all open anomalies, review details, and approve a correction with a required note.
- As a manager, I can filter the audit timeline by employee and date to investigate a payroll dispute.

## Technical Considerations
- State management: React Query for data; optimistic UI for offline queue; show "Pending sync" until server ack.
- Error boundaries around time mutations; retries with backoff; dedupe UI on repeated taps.
- Event metadata rendering (no mutation in UI): use immutable IDs and display-only diffs.
- Telemetry: track clock action latency, reminder interactions, anomaly resolution funnel (PostHog).
- Feature flags (Flagsmith): enable anomaly types incrementally; toggle SMS/email channels in UI.

## Success Criteria
- Clock in/out completed in ≤2 taps on mobile; median action time <5 seconds.
- ≥90% of detected anomalies are viewed; ≥70% are resolved or submitted within 2 business days.
- Reminder engagement: ≥60% CTR on in-app reminders; ≤10% repeated end-of-day overdue states per user.
- Zero client-side data loss: all offline actions eventually synced; no orphaned "Pending sync" after 24h.
- Accessibility: automated checks pass (axe) with no critical violations on timeclock, anomalies, audit screens.

