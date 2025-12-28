# ScheduleFlow MVP — Frontend/UI PRD

## Feature Overview
Enable users to generate a baseline schedule from backlog and constraints, surface conflicts via a constraint tracker, and create draft notifications that are approval-gated before sending. Mobile-first UX with review-first flows, clear conflict resolution, and auditable approvals.

## Requirements
- Views and Navigation
  - Web (Next.js): route /schedule with weekly calendar (default) and daily detail; responsive down to 320px.
  - Mobile (Expo RN): Schedule tab with Agenda (list) and Day views; bottom sheet for details.
  - Persistent toolbar: filters (Crew, Project, Status), date picker, "Generate Baseline," "Constraint Tracker," "Draft Notifications."
- Baseline Generation
  - Generation panel (sheet/modal):
    - Inputs: date range (required), crews (multi-select), work hours template, buffer (mins), include travel time (toggle), include client availability (toggle), prioritize (earliest due / highest value).
    - Backlog selector: jobs not scheduled or partially scheduled; multi-select with search.
  - On submit: show "Proposed" layer on calendar/agenda (distinct style: dashed border, muted fill).
  - Actions: Accept All, Accept Selected, Discard Proposal. Accept moves items to "Scheduled" state.
- Constraint Tracker
  - Side panel lists conflicts with severity (Critical/Warning) and type tags (Overbooked crew, Skill mismatch, Client blackout, Travel overlap, Outside work hours).
  - Each conflict row: badge count, affected items, quick actions (Reassign crew, Shift by X, Split, Mark as exception).
  - Clicking a conflict highlights affected items in the calendar and scrolls agenda.
  - Filters: by severity, crew, project. Empty state with guidance.
- Schedule Interactions
  - Calendar: drag-and-drop (web) to move/resize; click/tap to open detail drawer.
  - Mobile: long-press to move; resize via detail drawer controls (duration +/-).
  - Unsaved changes banner when editing proposed schedule; undo/redo for local edits.
- Draft Notifications (Approval-Gated)
  - Auto-generate drafts when: accepting baseline or making schedule changes to existing items.
  - Draft center modal: grouped by recipient type (Crew, Client, Internal).
    - Per draft: channels (Email/SMS/In-app) with previews, tokens badge list ({job_name}, {date}, {arrival_window}), send timing (immediate/scheduled), recipient list with opt-out indicators.
    - Actions: Edit content (inline), Approve & Send, Save Draft, Discard. Bulk approve supported.
  - Approval roles: Owner/Manager can approve; others view-only. Show approval audit note (required text input).
  - Global banner and navbar badge indicate pending drafts.
- States and Feedback
  - Empty: no schedule -> prompt to generate.
  - Loading/skeleton for calendar, tracker, and preview panels.
  - Error toasts with retry; optimistic UI disabled for sends (review-first).
- Accessibility
  - Keyboard navigation for calendar grid, ARIA roles for list and dialog, focus traps in modals/sheets, color-contrast compliant badges, live region for draft count updates.

## User Stories
- As an owner, I generate a baseline schedule for next week, review conflicts, accept the proposal, and approve all related notifications in one batch.
- As a scheduler/estimator, I adjust a conflicted job, resolve the constraint via reassign, and save without sending notifications yet.
- As a crew lead, I view my schedule and acknowledge in-app notifications (read-only; no approval).
- As a client (portal), I see confirmed appointment times only; no draft visibility.

## Technical Considerations
- Web components (Next.js App Router):
  - apps/web/app/schedule/page.tsx (layout, filters, toolbar)
  - apps/web/app/schedule/_components/CalendarBoard.tsx
  - apps/web/app/schedule/_components/AgendaList.tsx
  - apps/web/app/schedule/_components/GenerationSheet.tsx
  - apps/web/app/schedule/_components/ConstraintPanel.tsx
  - apps/web/app/schedule/_components/DraftCenterDialog.tsx
  - apps/web/app/schedule/_components/ScheduleItemDrawer.tsx
- Mobile components (Expo):
  - apps/mobile/src/screens/ScheduleScreen.tsx
  - apps/mobile/src/components/AgendaView.tsx, DayView.tsx, ConstraintSheet.tsx, DraftCenter.tsx, ItemSheet.tsx
- UI kit: Tailwind + Shadcn (Dialog/Sheet, Badge, Tabs, Dropdown, Toast); consistent tokens across web/mobile.
- RBAC: hide approve actions for unauthorized roles; show disabled buttons with tooltip.
- Flagsmith: scheduleflow_mvp gates "Generate Baseline" and "Draft Notifications."
- Telemetry: PostHog events (schedule_generate_clicked, schedule_proposal_accepted, constraint_resolved, notification_draft_created, notification_approved_sent, notification_discarded).

## Success Criteria
- Users can generate and accept a baseline within 2 minutes and ≤3 clicks after input.
- 100% of external notifications require explicit approval; zero auto-sends without approval.
- Constraint tracker surfaces conflicts with ≤200ms additional render time on web; mobile list scrolls at 60fps.
- ≥80% of baseline proposals accepted at least partially in pilot usage.
- Telemetry coverage for all key events; Sentry error rate <1% for schedule interactions; accessibility checks pass WCAG AA for key flows.

