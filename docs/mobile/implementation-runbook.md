# Mobile Implementation Runbook (v1)

Order of execution
1) Apply Hotfix Pack (docs/mobile/hotfix-pack/) to layout, globals, Tailwind config.
2) Create protected route shells with mobile-friendly scaffolds (/tasks, /meetings, /schedule, /timeclock, /docs, /ai-actions).
3) Convert any sidebar/drawer to a mobile sheet per pattern.
4) Cardize list views on <md (see module-ux docs).
5) Run Lighthouse Mobile (home + /tasks). Fix quick wins.
6) QA pass on device matrix. Fix remaining blockers.

Acceptance criteria
- No horizontal scroll at 360px on all pages above.
- Tap targets ≥ 44×44; touch-friendly forms.
- Transcript/log content wraps; no clipped code blocks.
- Login preserves ?next and redirects correctly after auth.
- Lighthouse Mobile: Perf ≥ 80, A11y ≥ 90, Best Practices ≥ 90.

Dev notes (Next.js App Router)
- Layout: apps/web/app/layout.tsx -> ensure viewport meta and safe areas.
- Styles: apps/web/app/globals.css -> mobile resets and wrapping.
- Tailwind: apps/web/tailwind.config.ts -> screens, container padding.

Handoff to Cursor
- Use this runbook as the source of truth.
- Commit style: feat(taskflow): mobile list cards; chore(mobile): apply hotfix 1/6
