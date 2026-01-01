# Mobile-First & Responsive Guidelines (v1)

Goal: Ensure BuildFlow Pro 2025 is fully usable on mobile (360–430px), with no horizontal scroll, a11y-compliant hit targets, and smooth navigation.

Principles
- Mobile-first: Design smallest breakpoint first; progressively enhance.
- Performance budget: TTI ≤ 3s on mid-tier mobile, Lighthouse Mobile Perf ≥ 80.
- Accessibility: Tap targets ≥ 44×44px, color contrast ≥ 4.5:1, keyboard + screen-reader friendly.
- Content priority: One primary action per screen; secondary actions in menus/sheets.

Breakpoints (Tailwind defaults)
- sm: 640px, md: 768px, lg: 1024px, xl: 1280px
- Design baseline: 360×740 (Android), 390×844 (iPhone 12/14)

Layout rules
- Container: p-4 at <md; avoid nested horizontal scrolling. Use overflow-x-hidden on body.
- Safe areas: Respect env(safe-area-inset-*) on iOS (padding on top/bottom when position: fixed).
- Grids: Collapse to 1-col on <md; avoid more than two columns on small devices.

Navigation patterns
- Desktop drawer → Mobile sheet (bottom modal) for global nav/filters.
- Use sticky top bars for context; avoid nested sticky elements.
- Preserve ?next param on login to return to intended route.

Touch & interaction
- Tap targets: min-h-[44px] and px-4; spacing: gap-3+ for groups.
- Gestures: Optional only; always provide explicit controls.
- Text: Base 16px; use leading-relaxed and hyphens-auto for long content.

Data presentation
- Lists: Cardized rows with key KPIs, status chips, and trailing chevron.
- Tables: Convert to stacked cards on <md.
- Long text (transcripts/logs): Use overflow-wrap: anywhere; wrap pre/code.

Media & icons
- Next/Image with sizes attr; lazy default; avoid layout shifts.
- Icon-only buttons must have aria-label.

Accessibility
- Landmark roles: header/main/nav; visible :focus-visible.
- Form labels always visible; error text with aria-live="polite".

Testing & QA
- Devices: iPhone 12/14 Safari, Pixel 6 Chrome.
- Targets: Lighthouse Mobile A11y ≥ 90; No CLS > 0.1; No horizontal scroll at 360px.

References in this repo
- Next.js App Router at apps/web/app/*
- Global styles: apps/web/app/globals.css
- Layout root: apps/web/app/layout.tsx

See hotfix-pack for ready-to-apply snippets.
