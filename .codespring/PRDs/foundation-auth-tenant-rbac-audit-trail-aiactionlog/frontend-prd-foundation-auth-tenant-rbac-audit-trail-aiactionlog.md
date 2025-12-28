## Feature Overview
Provide multi-tenant authentication with org selection/switching, role-based UI access, session management, explicit AI consent capture, and a read-only AIActionLog viewer. Ensure all AI proposals are review-first with clear consent UX and immutable, filterable audit visibility across web and mobile.

## Requirements
- Auth
  - Screens: Sign In, Sign Up, Accept Invite, Forgot/Reset Password, 2FA (optional placeholder).
  - Public routes display as centered cards; support email + magic link and password flows.
  - Error states: invalid token, expired link, account locked, org suspended, no org membership.
- Tenant
  - Tenant switcher in top app bar showing org name + plan tag; searchable list if >5 orgs.
  - Post-login: org selection screen if multiple memberships; auto-enter last-used otherwise.
  - Invite acceptance screen displays inviter, org, role, and policies acknowledgement.
- RBAC UX
  - Permission guard behavior:
    - Hide sensitive navigation if user lacks permission.
    - Inline masked fields display “Redacted” with tooltip (PII).
    - For attempted restricted actions, show modal: “You don’t have access” with CTA to request (opens prefilled support email).
  - Role badges rendered near user avatar and in org members table.
  - 403 page with context, org admin contact, and return to dashboard.
- Consent Capture (AI)
  - When any AI action proposes an output/change, show modal drawer before side effects:
    - Summary: title, affected record(s), risk flags.
    - Output preview (diff if updating), citations list, redaction indicators.
    - Required checkbox: “I reviewed and approve applying these changes.”
    - Optional checkbox: “Allow this action without prompt next time” (if feature flag enabled).
    - Primary buttons: Approve & Apply, Reject, Save as Draft (if applicable).
  - Log consent outcome to AIActionLog and gate downstream actions on approval.
- AIActionLog (read-only)
  - Access: global Audit in nav and contextual “AI” badge on entities (opens drawer).
  - Views:
    - List: time-ordered, virtualized; columns: time, actor (AI model/user), action, scope (module/entity), status (proposed/approved/rejected), risk.
    - Filters: date range, module, action type, status, actor, tenant, risk level; free-text search.
    - Detail drawer: event ID, timestamp, model/version, prompt type, input redactions, output preview, citations (expand to source), diff view, approver identity, latency, hashes.
  - Controls: copy Event ID, download JSON, link to related record.
  - States: loading skeletons, empty with guidance, error with retry.
- Session Management
  - Idle timeout prompt: “Session expiring in 2:00” with Extend/Sign out.
  - Re-auth modal for sensitive actions (enter password/magic link).
  - Cross-device sign-out reflects within 15s; show toast and redirect to signin.
- Accessibility
  - All modals use focus trap, keyboard navigation, aria-labels, visible focus rings.
  - High-contrast role badges; color is not sole status indicator.
  - Screen-reader descriptions for redactions and consent checkboxes.
- Responsive
  - Mobile-first: consent as full-screen sheet; audit list as paginated with pull-to-refresh.
  - Desktop: split pane for audit list/detail; sticky filters.

## User Stories
- As a user in multiple orgs, I must select or switch tenants quickly and see current context.
- As a crew lead with limited permissions, I should not see restricted actions and get a clear explanation if I try.
- As an estimator, I must review AI proposals with citations and approve before changes occur.
- As an owner, I need a tamper-proof audit trail of all AI actions with who approved and what changed.

## Technical Considerations
- Web routes/components
  - apps/web/app/(public)/signin/page.tsx
  - apps/web/app/(public)/signup/page.tsx
  - apps/web/app/(public)/accept-invite/[token]/page.tsx
  - apps/web/app/(app)/org/select/page.tsx
  - apps/web/app/(app)/settings/organization/page.tsx (members/roles)
  - apps/web/app/(app)/audit/page.tsx
  - apps/web/components/auth/AuthCard.tsx
  - apps/web/components/tenant/TenantSwitcher.tsx
  - apps/web/components/rbac/AccessGuard.tsx
  - apps/web/components/rbac/RoleBadge.tsx
  - apps/web/components/ai/ConsentModal.tsx
  - apps/web/components/ai/AIActionLogList.tsx
  - apps/web/components/ai/AIActionLogDetailDrawer.tsx
  - apps/web/components/common/DiffViewer.tsx, CitationPopover.tsx, RedactionChip.tsx
- Mobile screens
  - apps/mobile/src/screens/SignInScreen.tsx
  - apps/mobile/src/screens/TenantSwitchScreen.tsx
  - apps/mobile/src/screens/AuditLogScreen.tsx
  - apps/mobile/src/components/ConsentSheet.tsx
- Shared UI (shadcn/Tailwind)
  - packages/ui: AuthCard, TenantSwitcher, RoleBadge, AccessGuard, ConsentModal/Sheet, AIActionLogList, AIActionLogItem, AIActionLogDetail, DiffViewer, Badge, Toast.
- Instrumentation: capture consent decisions and audit views via PostHog; error boundaries send to Sentry. Log event IDs in OTel spans.
- Feature flags: flagsmith keys ai_consent_skip_allowed, audit_log_enabled.

## Success Criteria
- Users can authenticate, accept invites, and select/switch tenants without errors.
- RBAC reliably hides/informs; zero unauthorized actions are executable from UI.
- All AI actions trigger consent UI; no AI side effect occurs without explicit approval.
- AIActionLog is navigable and filterable; event detail exposes citations and diffs.
- Mobile and web meet accessibility criteria (WCAG AA) and responsive specs.
- ≥95% successful session renewals; <1% client-side auth errors; PostHog funnels show >85% completion for consent modal.


