# CloserFlow MVP — Frontend/UI PRD

## Feature Overview
Enable sales users to capture a lead, progress stages (new → discovery → proposal → decision), generate "next-best" discovery questions, draft follow-ups (email/SMS) with citations, and assemble scope/estimate/proposal drafts behind explicit approval gates. All outbound sends and document progressions are review-first with RBAC and audit trail, emitting the defined events.

## Requirements

- Routes & RBAC
  - Web: /apps/web/src/app/(app)/leads/[leadId]/page.tsx (SSR/CSR hybrid OK)
  - Mobile (parity): /apps/mobile/src/app/(app)/leads/[leadId].tsx
  - Access: Sales, Owner only (Better-auth); others see 403 with contact admin prompt.

- Lead Details Header
  - Displays lead name, primary contact (name, phone, email), stage badge, created/updated, assignee.
  - Stage dropdown with allowed transitions: new→discovery, discovery→proposal, proposal→decision; backward move allowed with confirmation.
  - Actions: "Generate Questions", "Draft Follow-up", "Draft Scope", "Draft Estimate", "Draft Proposal".
  - Status toasts and inline banners for pending AI jobs; Sentry on failure.

- Discovery Questions Panel
  - Sections: "Next-best Questions" (generated) and "Answers".
  - States: Empty (CTA to Generate), Generating (spinner), Drafted (list with confidence, source badges), Regenerate (requires confirm).
  - Each question shows: text, source (citation popover with snippet + link), confidence chip.
  - Answer capture: text input per question, save inline; edited answers marked "unsaved" until saved.
  - Persisted questions and answers show author/time; edits tracked in audit sidebar.

- Follow-up Drafts (Email/SMS)
  - Tabbed card: Email | SMS.
  - Draft area: subject (email), body (rich text for email, plain text for SMS), citation drawer (inline numbered markers linking to sources).
  - Buttons: Regenerate, Save Draft, Approve (locks content), Send (enabled only when Approved).
  - Send modals:
    - Email: choose recipients (default primary contact), from alias, preview, add attachments (optional), confirm.
    - SMS: confirm phone, 160-char segments counter, carrier compliance notice.
  - Post-send: show "Sent" badge, timestamp, message id; disable edits; allow Resend as new draft (duplicates content as unapproved).

- Document Drafts (Scope, Estimate, Proposal)
  - Simple template preview pane with editable sections (Project Summary, Inclusions, Exclusions, Line Items for Estimate).
  - Actions: Regenerate, Save Draft, Approve. No external send in MVP; provide "Download PDF" disabled until Approved.
  - Badges: Draft, Needs review, Approved. Show change log when edited after approval (reverts to Needs review).

- Audit & Events Sidebar
  - Right rail timeline: LeadCreated, StageChanged, ScopeDrafted, EstimateDrafted, ProposalDrafted, FollowUpDrafted, DraftApproved, MessageSent.
  - Each entry shows actor, time, payload summary, and link to item.

- States & Validation
  - Global loading skeletons; empty states with CTA; error banners with retry.
  - Required fields: contact name + one contact method; validate phone/email formats.
  - Cooldown: Regenerate button disabled for 10s after run; show tooltip.

- Responsive & Accessibility
  - Mobile-first stacked layout; on desktop, two-column: main content + audit rail.
  - Keyboard navigable; focus states; ARIA roles for tabs, modals, status; high-contrast compliant; screen-reader labels for citations.

- Component Architecture (web)
  - /apps/web/src/app/(app)/leads/[leadId]/page.tsx
  - /apps/web/src/components/leads/LeadHeader.tsx
  - /apps/web/src/components/leads/StageSelector.tsx
  - /apps/web/src/components/leads/DiscoveryQuestions.tsx
  - /apps/web/src/components/leads/FollowUpDraft.tsx
  - /apps/web/src/components/leads/DocumentDraft.tsx
  - /apps/web/src/components/leads/AuditTimeline.tsx
  - Shared UI from /packages/ui (Shadcn/Tailwind)

## User Stories
- As a Sales user, I can create a lead and advance/revert stages with confirmation.
- As a Sales user, I can generate next-best discovery questions with citations and record answers.
- As a Sales user, I can draft, approve, and send follow-up email/SMS; sending is blocked until approved.
- As a Sales user, I can draft and approve scope/estimate/proposal; PDF download is enabled only after approval.
- As an Owner, I can view an audit timeline of drafts, approvals, sends, and stage changes.

## Technical Considerations
- API endpoints (invoke via Hono routes):
  - POST /leads; PATCH /leads/:id/stage
  - POST /leads/:id/questions:generate; POST /leads/:id/followup:generate (type=email|sms)
  - POST /leads/:id/scope; POST /leads/:id/estimate; POST /leads/:id/proposal
  - POST /drafts/:id/approve; POST /drafts/:id/send (email|sms)
- Event badges in UI reflect server-emitted statuses (LeadCreated.v1, StageChanged.v1, ScopeDrafted.v1, EstimateDrafted.v1).
- Approval gating: drafts become read-only; any edit creates a new draft version requiring re-approval.
- Instrumentation: PostHog events (lead_stage_changed, questions_generated, followup_drafted, draft_approved, message_sent); OTel trace ids included in requests.

## Success Criteria
- Users can complete: lead creation → discovery Qs → follow-up draft → approval → send; and draft scope/estimate/proposal with approvals.
- All sends are blocked until approval and logged in audit; corresponding events emitted.
- UI shows citations for AI-generated content and captures answers reliably.
- Responsive, accessible, and stable (no console errors); Sentry shows zero uncaught UI errors in smoke tests.
- E2E test passes for draft → approve → send flow.

