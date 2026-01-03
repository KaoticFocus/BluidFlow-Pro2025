# BuildFlow Pro — Documentation Index

> **Last updated:** 2026-01-03

## Overview

This documentation hub contains architectural guides, Product Requirements Documents (PRDs), database schemas, and implementation runbooks for all BuildFlow Pro modules. Each module folder includes frontend, backend, and database PRDs along with code skeleton references.

## Quick Links

### Core Modules

| Module | Description | Documentation |
|--------|-------------|---------------|
| **ScheduleFlow** | AI-powered schedule generation, constraint tracking, crew notifications | [docs/scheduleflow/](./scheduleflow/README.md) |
| **TimeClockFlow** | Mobile-first time tracking with geofencing, anomaly detection, reminders | [docs/timeclockflow/](./timeclockflow/README.md) |
| **Dashboard** | Unified dashboard with KPI tiles and drill-down navigation | [docs/dashboard/](./dashboard/README.md) |

### Platform Documentation

| Area | Description | Link |
|------|-------------|------|
| **Mobile Guidelines** | Mobile-first design patterns, touch targets, responsive layouts | [docs/mobile/](./mobile/mobile-first-guidelines.md) |
| **Mobile Hotfix Pack** | Viewport, typography, navigation fixes for mobile | [docs/mobile/hotfix-pack/](./mobile/hotfix-pack/README.md) |
| **Module UX Briefs** | Per-module mobile UX specifications | [docs/mobile/module-ux/](./mobile/module-ux/) |
| **QA Checklist** | Mobile QA readiness checklist | [docs/mobile/qa-readiness-checklist.md](./mobile/qa-readiness-checklist.md) |

## Documentation Structure

```
docs/
├── README.md                    # This index
├── scheduleflow/                # ScheduleFlow module
│   ├── README.md               # Module overview
│   ├── prd-mvp.md              # MVP product requirements
│   ├── database-prd.md         # Database schema
│   ├── frontend-prd-home.md    # Frontend PRD for Home view
│   ├── backend-prd-home.md     # Backend PRD for Home API
│   └── code-skeletons.md       # Code structure and stubs
├── timeclockflow/               # TimeClockFlow module
│   ├── README.md               # Module overview
│   ├── frontend-prd-mvp.md     # Frontend MVP requirements
│   ├── backend-prd-mvp.md      # Backend MVP requirements
│   ├── database-prd.md         # Database schema
│   ├── frontend-prd-home.md    # Frontend PRD for Home view
│   ├── reminders-twilio.md     # Twilio integration for reminders
│   └── todos.md                # Engineering TODOs
├── dashboard/                   # Dashboard module
│   ├── README.md
│   ├── frontend-prd.md
│   ├── backend-prd.md
│   └── drilldown-ux.md
└── mobile/                      # Mobile platform docs
    ├── mobile-first-guidelines.md
    ├── hotfix-pack/
    └── module-ux/
```

## Contributing to Documentation

### Adding New Documentation

1. **Create a folder** under `docs/` with the module name (kebab-case)
2. **Add a README.md** with module overview and links to child documents
3. **Use consistent headings**: H1 for title, H2 for major sections, H3 for subsections
4. **Include metadata**: Add `Last updated:` date at the top of each document
5. **Cross-reference**: Link to related docs and code paths

### Naming Conventions

| File Type | Pattern | Example |
|-----------|---------|---------|
| Module overview | `README.md` | `scheduleflow/README.md` |
| MVP PRD | `prd-mvp.md` | `scheduleflow/prd-mvp.md` |
| Feature PRD | `{area}-prd-{feature}.md` | `frontend-prd-home.md` |
| Database PRD | `database-prd.md` | `timeclockflow/database-prd.md` |
| Integration docs | `{integration}.md` | `reminders-twilio.md` |
| TODOs | `todos.md` | `timeclockflow/todos.md` |

### Writing Style

- Use **imperative mood** for acceptance criteria: "Display error message when..."
- Keep descriptions **concise** and action-oriented
- Include **code references** with file paths when applicable
- Mark incomplete sections with `<!-- TODO: ... -->`

## Related Resources

- **PRDs (CodeSpring)**: `.codespring/PRDs/` — synced product requirements
- **API Documentation**: Generated from OpenAPI specs in `apps/api`
- **Component Library**: Storybook (if enabled) at `/storybook`
