# ScheduleFlow Frontend PRD — Home

> **Last updated:** 2026-01-03  
> **Status:** Draft

## Objectives

1. Provide a clear overview of all schedules for the current organization
2. Enable quick actions: create, filter, search, navigate to detail
3. Surface schedule status and pending approvals prominently
4. Maintain mobile-first responsive design

## Information Architecture

```
/scheduleflow (Home)
├── Header: Title + Create button
├── Filters: Status, date range, search
├── Schedule List/Grid
│   └── Schedule Card
│       ├── Name, dates, status badge
│       ├── Activity count, assigned users
│       └── Actions: View, Edit, Approve
└── Empty State / Loading / Error
```

## Navigation

| From | To | Trigger |
|------|----|---------|
| Dashboard | ScheduleFlow Home | Click "ScheduleFlow" tile or nav link |
| ScheduleFlow Home | Schedule Detail | Click schedule card |
| ScheduleFlow Home | Create Schedule | Click "New Schedule" button |
| Schedule Detail | ScheduleFlow Home | Back button or breadcrumb |

## Views and States

### Schedule List View

**Default State:**
- Display schedules as cards in a responsive grid (1 col mobile, 2 cols tablet, 3 cols desktop)
- Sort by `updated_at` descending by default
- Paginate: 20 items per page

**Card Content:**
- Schedule name (truncate at 50 chars)
- Date range formatted: "Jan 3 – Jan 10, 2026"
- Status badge with color coding:
  - Draft: gray
  - Pending: amber
  - Approved: green
  - Rejected: red
- Activity count: "12 activities"
- Assigned users: Avatar stack (max 3) + overflow count

**Acceptance Criteria:**
- [ ] Display schedules with name, dates, status, activity count
- [ ] Show loading skeleton during fetch
- [ ] Handle empty state with CTA to create
- [ ] Paginate with "Load more" or numbered pages
- [ ] Filter by status persists in URL

### Filter Bar

| Filter | Type | Options |
|--------|------|---------|
| Status | Multi-select chips | All, Draft, Pending, Approved, Rejected |
| Date Range | Date picker | Quick: This week, This month, Custom |
| Search | Text input | Searches name, description |

**Behavior:**
- Filters update URL query params: `?status=pending&from=2026-01-01`
- Debounce search input (300ms)
- Clear all button resets to default

### Empty State

**No schedules:**
```
[Calendar Icon]
No schedules yet
Create your first schedule to start planning.
[Create Schedule Button]
```

**No results (with filters):**
```
[Search Icon]
No schedules match your filters
Try adjusting your search or filters.
[Clear Filters Button]
```

### Loading State

- Show 6 skeleton cards matching card dimensions
- Pulse animation
- Disable filters during initial load

### Error State

**API failure:**
```
[Error Icon]
Unable to load schedules
Something went wrong. Please try again.
[Retry Button] [Contact Support Link]
```

## Components

| Component | Description | File Path |
|-----------|-------------|-----------|
| `ScheduleFlowPage` | Page container with data fetching | `app/(dashboard)/scheduleflow/page.tsx` |
| `ScheduleList` | Grid of schedule cards | `components/scheduleflow/ScheduleList.tsx` |
| `ScheduleCard` | Individual schedule display | `components/scheduleflow/ScheduleCard.tsx` |
| `ScheduleFilters` | Filter bar component | `components/scheduleflow/ScheduleFilters.tsx` |
| `StatusBadge` | Colored status indicator | `components/ui/StatusBadge.tsx` |

## Accessibility

| Requirement | Implementation |
|-------------|----------------|
| Keyboard navigation | Tab through cards, Enter to open |
| Screen reader | Cards have `aria-label` with full context |
| Focus management | Focus first card after filter change |
| Color contrast | All status badges meet WCAG AA |
| Touch targets | Minimum 44x44px for all interactive elements |

## Internationalization (i18n)

| String | Key | Notes |
|--------|-----|-------|
| "ScheduleFlow" | `scheduleflow.title` | Page title |
| "New Schedule" | `scheduleflow.create` | Create button |
| "No schedules yet" | `scheduleflow.empty.title` | Empty state |
| Status labels | `scheduleflow.status.{status}` | draft, pending, etc. |

## Performance Budgets

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s |
| Time to Interactive | < 3s |
| Largest Contentful Paint | < 2.5s |
| Bundle size (page) | < 50KB gzipped |

## Tracking Plan

| Event | Properties | Trigger |
|-------|------------|---------|
| `scheduleflow.home.viewed` | `schedule_count`, `filter_status` | Page load |
| `scheduleflow.filter.applied` | `filter_type`, `filter_value` | Filter changed |
| `scheduleflow.card.clicked` | `schedule_id`, `schedule_status` | Card click |
| `scheduleflow.create.clicked` | | Create button click |

## Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| < 640px (mobile) | 1 column, stacked filters |
| 640-1024px (tablet) | 2 columns, inline filters |
| > 1024px (desktop) | 3 columns, sidebar filters (optional) |

## Design Tokens

Use existing design system tokens:
- Colors: `--color-status-draft`, `--color-status-pending`, etc.
- Spacing: `--space-4`, `--space-6` for card padding
- Typography: `--font-size-lg` for card titles

<!-- TODO: Link to Figma designs when available -->
