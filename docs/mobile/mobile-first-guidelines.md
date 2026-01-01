# Mobile-First Guidelines (v1)

Purpose
- Establish a consistent, mobile-first UX baseline across the app with clear acceptance criteria.

Targets
- Lighthouse Mobile: Performance ≥ 80, Accessibility ≥ 90, Best Practices ≥ 90 on Home and main list page.
- No horizontal scroll at 360px width; all interactive elements ≥ 44×44 px.

Viewport & Safe Areas
- <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
- Use dynamic viewport units for full-height regions: min-height: 100dvh.
- Apply safe area insets on body and fixed/sticky bars: padding: env(safe-area-inset-*)

Typography & Layout
- Fluid type: html { font-size: clamp(15px, 1.6vw, 16px); }
- Prevent overflow: html, body { overflow-x: hidden; }
- Containers: max-width: 100%; padding-inline: 16px on mobile.

Navigation (Mobile)
- Hide desktop sidebar/drawer under md; provide a mobile menu (bottom sheet or modal).
- Focus trap while open, restore focus on close; lock body scroll; close on Esc/backdrop.

Lists & Cards
- Prefer cards over dense tables on mobile; large tap area, multiline titles, status chips.
- One primary action per card; secondary actions in a trailing menu.

Text & Long Content
- Wrap anywhere: .content { overflow-wrap: anywhere; word-break: break-word; }
- Use line clamp for previews; allow full expansion on detail pages.

Forms
- Labels or aria-labels; inputs not obscured by keyboard; scroll-into-view on focus.
- Touch-friendly controls and spacing.

Images & Media
- Provide width/height; lazy-load below the fold; modern formats where possible.

Accessibility
- Visible focus with :focus-visible; color contrast ≥ AA; hit targets ≥ 44×44.
- Dialogs/sheets are keyboard and screen-reader friendly.

Performance Quick Wins
- Defer non-critical scripts; dynamic import heavy components; remove unused prefetch.

QA
- Validate on iPhone 12/13 mini (360px) and Pixel 6; ensure no horizontal scroll anywhere.

