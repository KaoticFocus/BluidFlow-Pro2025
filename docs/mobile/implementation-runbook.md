# Implementation Runbook (Mobile-First v1)

Scope
- Layout/UX/perf/a11y only. No business logic changes.

Branch
- git checkout -b mobile-hotfix-v1

Order of Work
1) Global viewport + safe areas
- Add viewport meta (App/Pages Router equivalent).
- Add safe-area padding and 100dvh containers.

2) Navigation (mobile)
- Hide desktop nav under md; add MobileNav sheet/modal with focus trap and body scroll lock.

3) Lists → Cards
- Convert dense tables to stacked cards at <md; large tap targets; primary action surfaced.

4) Text wrapping & clamps
- Apply overflow-wrap:anywhere; clamp long previews; allow expansion in details.

5) Performance
- Images sized + lazy; dynamic import heavy modules; remove unused prefetch/preconnect.

6) Accessibility
- 44×44 targets, visible focus, AA contrast, labeled controls.

7) Lighthouse Mobile
- Targets: Perf ≥ 80, A11y ≥ 90, BP ≥ 90 on Home + main list.

8) Device QA
- iPhone mini 360px & Pixel 6: no horizontal scroll; nav/dialog usability; keyboard-safe inputs.

Deliverables
- PR titled: chore(mobile): mobile-first hotfix pack v1 + baseline Lighthouse targets
- Include scores, device notes, and changed files.
