# TaskFlow MVP

## Feature Overview
Enable fast task creation and management via voice, photo, or message; support checklists and punch list items; and generate a daily plan that is human-reviewed and approval-gated. Mobile-first UI with clear review queues, minimal taps, and offline-tolerant capture. All AI-derived items remain “Suggested” until explicitly approved.

## Requirements

- Entry Points
  - Global “+ Task” FAB (mobile) / primary button (desktop) persistent in Task views.
  - Job-level Task tab with filters: All, My Tasks, Suggested, Punch List, Today.
  - Daily Plan screen per job with date picker (defaults to today).

- Task Creation Modal (three tabs: Voice, Photo, Message)
  - Shared fields: Job (preselected if in context), Title (AI-suggested editable), Description, Assignee, Due date, Priority, Tags, Attachments.
  - Voice
    - Record button with timer (max 2 mins), VU meter, pause/resume.
    - Consent checkbox (required) when capturing anyone else’s voice; tooltip explains purpose.
    - Post-record: transcription preview (editable), AI-suggested title/fields, “Create Suggested Task” or “Create Approved Task” (RBAC-gated).
    - States: mic permission denied, recording in progress, uploading, transcribing, AI drafting, error retry.
  - Photo
    - Mobile: camera capture with retake; Web: upload (JPG/PNG/HEIC). Multiple photos allowed.
    - Inline note field and optional voice caption.
    - AI proposes tasks from photo(s); user selects 0–N tasks or creates single task.
  - Message
    - Plain text input with quick templates (e.g., “Material pickup”, “Site clean-up”).
    - AI optional “Suggest fields” chip; never auto-approves.

- Task List & Cards
  - Columns (desktop) / segmented filters (mobile).
  - Card shows: title, status pill (Suggested/Pending Approval/Approved/In Progress/Done/Blocked), assignee avatar, due, checklist progress, source icon (voice/photo/message), attachment count.
  - Bulk actions in Suggested: Approve, Edit, Dismiss.
  - Empty states with CTA to create or import from MeetingFlow transcript.

- Review & Approval
  - Suggested tasks open in Review Drawer: diff-highlight between AI suggestion and edits.
  - Actions: Approve (locks audit note), Request Edit (adds comment, keeps Suggested), Dismiss (requires reason).
  - Approval requires role with permission; non-authorized users see “Request approval” flow.

- Task Detail
  - Editable fields as above; activity timeline (created/approved/edits).
  - Checklist sub-items: add/reorder (drag), mark complete, convert sub-item to task.
  - Attachments viewer (photos, audio snippet playback).

- Punch List
  - Toggle “Punch List” on task. Punch List filter shows only items with location field.
  - Quick-add from Photo or Voice with default status “Punch - Open.”
  - Statuses: Open, Fixed (Needs Verification), Verified.
  - Verification requires approver; UI shows photo-before/after pair.

- Daily Plan
  - Generate Draft button: AI proposes today’s scope, tasks, sequencing, crew, materials.
  - Draft view: sections (Crew, Tasks, Dependencies, Materials). Inline edits allowed.
  - Actions: Regenerate (confirm overwrite), Save Draft, Publish Plan (approval-gated).
  - Post-publish banner + read-only state; “Create tasks from plan” confirmation (if new).

- Responsiveness & UX
  - Mobile-first: 1-column lists; swipe actions on task cards (Approve, Dismiss).
  - Desktop: 2–3 column layout; drag-and-drop checklist; resizable Review Drawer.
  - Loading: skeletons for lists and detail; optimistic “Pending” badges on slow ops.

- Accessibility
  - Keyboard navigable modals/drawers, focus traps, ARIA labels on mic/camera controls.
  - Transcription text is editable; provide captions and alt text prompts for images.
  - Status colors meet WCAG contrast; non-color indicators for state.

## User Stories
- As a field lead, I capture a task via voice and see an editable transcription to approve or request approval.
- As an estimator, I convert site photos into punch list items and mark them “Needs Verification.”
- As an owner, I review Suggested tasks, bulk-approve relevant ones, and dismiss duplicates.
- As a crew lead, I generate a daily plan, edit sequencing, and submit for approval, then publish.

## Technical Considerations
- Feature flag: taskflow_mvp with subflags voice_input, photo_to_task, daily_plan.
- Audio: show permission prompts; 120s max; background upload with retry; offline queue (Expo) with “Pending upload” state.
- Photo: client-side resize to max 2000px; multi-select; progress indicators per file.
- Error handling: granular toasts; inline error states with retry; preserve unsaved text.
- Telemetry: PostHog events (task_create_start/success/fail, source, approval_action, daily_plan_generate/publish).
- Sentry boundaries around capture/transcription flows.
- RBAC: hide approval actions if unauthorized; show “Request approval” CTA.

## Success Criteria
- Median time to create a task (from entry to saved) ≤ 20 seconds.
- ≥ 60% of new tasks created via voice or photo within first month.
- ≥ 80% of AI-suggested tasks receive an explicit approve/dismiss action.
- Daily plan: ≥ 70% of active jobs publish at least 3 plans/week.
- Error rate for capture/transcription/upload < 2%; no P0 accessibility blockers.
- Telemetry coverage ≥ 95% of critical flows; audit notes present on 100% of approvals.


