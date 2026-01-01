# Mobile QA Readiness Checklist (v1)

Layout & nav
- [ ] No horizontal scroll at 360px on Home, Tasks, Meetings, Schedule, TimeClock, Docs, AI Actions
- [ ] Sticky header behavior is stable; no double-sticky
- [ ] Drawer replaced by mobile sheet where used

Interaction
- [ ] All primary actions ≥ 44×44 hit area
- [ ] Form fields readable and tappable; labels visible
- [ ] Focus rings visible; keyboard navigation works

Content
- [ ] Lists cardized on <md with clear affordance (chevron)
- [ ] Long text (transcripts/logs) wraps without overflow
- [ ] Code/pre blocks scroll horizontally without page overflow

Performance & a11y
- [ ] Lighthouse Mobile: Perf ≥ 80, A11y ≥ 90
- [ ] No images without width/height; no layout shifts > 0.1
- [ ] Color contrast passes (≥ 4.5:1)
