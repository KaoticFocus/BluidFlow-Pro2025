# ScheduleFlow — Module Overview

> **Last updated:** 2026-01-03

## Purpose and Scope

ScheduleFlow provides AI-powered schedule generation and management for construction projects. It enables project managers to create baseline schedules, define constraints, track progress, and coordinate crew notifications with approval-gated workflows.

### Who Uses It

- **Project Managers**: Create and manage project schedules
- **Superintendents**: View daily/weekly schedules, receive notifications
- **Crew Leads**: Get notified of schedule changes affecting their teams
- **Admins**: Configure constraints, approval workflows, and notification rules

## Key Capabilities

| Capability | Description |
|------------|-------------|
| **Schedule Generation** | AI-assisted creation of baseline schedules from scope and constraints |
| **Constraint Tracking** | Define and monitor scheduling constraints (weather, permits, dependencies) |
| **Activity Management** | CRUD operations for schedule activities with role assignments |
| **Crew Notifications** | Approval-gated notifications via email, SMS, and push |
| **Audit Trail** | Immutable log of all schedule changes with actor attribution |
| **Calendar Integration** | Sync with external calendars (Google, Outlook) |

## High-Level Flows

### Create Schedule

```
1. User clicks "New Schedule"
2. Enter project name, date range, timezone
3. AI suggests baseline activities (optional)
4. User reviews and adjusts activities
5. Save schedule (status: draft)
6. Submit for approval → status: pending
7. Approver reviews → status: approved/rejected
```

### Edit Schedule

```
1. Open existing schedule
2. Modify activities (drag to reschedule, edit details)
3. System validates against constraints
4. If constraint violation: show warning, require override reason
5. Save changes → audit log entry
6. If approved schedule: trigger re-approval workflow
```

### Notify Crew

```
1. Schedule reaches "approved" status
2. System identifies affected users/roles
3. Queue notifications per user preferences (email/SMS/push)
4. Require manager approval before sending (configurable)
5. Send notifications with throttling
6. Track delivery status and failures
```

## Documentation Links

| Document | Description |
|----------|-------------|
| [PRD (MVP)](./prd-mvp.md) | Full product requirements for MVP |
| [Database PRD](./database-prd.md) | Schema, tables, relationships |
| [Frontend PRD (Home)](./frontend-prd-home.md) | Home view UI/UX requirements |
| [Backend PRD (Home)](./backend-prd-home.md) | API endpoints and service design |
| [Code Skeletons](./code-skeletons.md) | File locations and stub code |

## Related Documentation

- [Mobile UX Brief](../mobile/module-ux/schedule-flow.md) — Mobile-specific UX patterns
- [Dashboard Integration](../dashboard/README.md) — KPI tiles and drill-down

## Runbook (Operations)

### Feature Flags

| Flag | Description | Default |
|------|-------------|---------|
| `FEATURE_SCHEDULEFLOW` | Enable/disable entire module | `false` |
| `FEATURE_SCHEDULEFLOW_AI` | Enable AI schedule generation | `false` |
| `FEATURE_SCHEDULEFLOW_NOTIFICATIONS` | Enable crew notifications | `false` |

### On-Call Tips

1. **Schedule not loading**: Check Prisma connection, verify tenant isolation
2. **Notifications not sending**: Check Redis/BullMQ, verify Twilio credentials
3. **AI generation failing**: Check OpenAI API key, verify rate limits

### Rollback Procedure

```bash
# Disable feature flag
export FEATURE_SCHEDULEFLOW=false

# If database migration issues:
pnpm --filter @buildflow/db db:migrate rollback

# Restart API server
pm2 restart api
```

### Key Metrics to Monitor

- `scheduleflow.schedule.created` — Schedule creation rate
- `scheduleflow.notification.sent` — Notification success rate
- `scheduleflow.api.latency` — P95 API response time
- `scheduleflow.constraint.violations` — Constraint violation frequency
