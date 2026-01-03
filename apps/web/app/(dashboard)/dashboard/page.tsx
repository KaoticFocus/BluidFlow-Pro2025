import Link from 'next/link';

/**
 * Dashboard Summary Response from API
 */
interface DashboardSummary {
  tasks: {
    overdue: number;
    dueToday: number;
    inProgress: number;
  };
  schedule: {
    upcomingPlans: number;
    approved: number;
  };
  updatedAt: string;
}

/**
 * Telemetry helper for tracking dashboard interactions
 * @todo Integrate with PostHog or analytics provider
 */
function trackEvent(event: string, properties?: Record<string, unknown>) {
  // TODO: Implement actual telemetry
  // Example: posthog.capture(event, properties);
  if (typeof window !== 'undefined') {
    console.debug('[Telemetry]', event, properties);
  }
}

/**
 * Fetch dashboard summary from API
 * Server-side fetch with cache disabled for fresh data
 */
async function getDashboardSummary(): Promise<DashboardSummary | null> {
  try {
    // In production, use absolute URL or environment variable
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const res = await fetch(`${apiUrl}/dashboard/summary`, {
      cache: 'no-store', // Always fetch fresh data
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!res.ok) {
      console.error('[Dashboard] Failed to fetch summary:', res.status);
      return null;
    }
    
    return await res.json();
  } catch (error) {
    console.error('[Dashboard] Error fetching summary:', error);
    return null;
  }
}

/**
 * Dashboard Page - Server Component
 * 
 * Fetches KPI data from /api/dashboard/summary and renders
 * clickable tiles that deep-link to filtered list views.
 */
export default async function DashboardPage() {
  // Fetch dashboard data (server-side)
  const summary = await getDashboardSummary();
  
  // Fallback values if API fails
  const tasks = summary?.tasks ?? { overdue: 0, dueToday: 0, inProgress: 0 };
  const schedule = summary?.schedule ?? { upcomingPlans: 0, approved: 0 };

  return (
    <div className="p-4 sm:p-6 space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-slate-400 mt-1">Welcome back! Here's what's happening today.</p>
        {!summary && (
          <p className="text-amber-400 text-sm mt-2">
            Unable to load live data. Showing cached values.
          </p>
        )}
      </div>

      {/* KPI Stats grid - all cards are clickable deep links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 min-w-0">
        <KPICard
          href="/taskflow?status=overdue"
          title="Overdue Tasks"
          value={tasks.overdue}
          delta={tasks.overdue > 0 ? `${tasks.overdue} need attention` : "All caught up!"}
          deltaType={tasks.overdue > 0 ? "negative" : "positive"}
          icon={OverdueIcon}
          iconBg="bg-red-500/10"
          iconColor="text-red-400"
          ariaLabel={`Open Overdue Tasks list (${tasks.overdue})`}
          eventName="dashboard.kpi_clicked"
          eventProps={{ kpi: 'tasksOverdue', value: tasks.overdue }}
        />
        <KPICard
          href="/taskflow?due=today"
          title="Tasks Due Today"
          value={tasks.dueToday}
          delta={`${tasks.inProgress} in progress`}
          deltaType="neutral"
          icon={TaskIcon}
          iconBg="bg-cyan-500/10"
          iconColor="text-cyan-400"
          ariaLabel={`Open Tasks Due Today list (${tasks.dueToday})`}
          eventName="dashboard.kpi_clicked"
          eventProps={{ kpi: 'tasksDueToday', value: tasks.dueToday }}
        />
        <KPICard
          href="/scheduleflow?status=approved"
          title="Approved Plans"
          value={schedule.approved}
          delta={`${schedule.upcomingPlans} upcoming`}
          deltaType="positive"
          icon={ScheduleIcon}
          iconBg="bg-emerald-500/10"
          iconColor="text-emerald-400"
          ariaLabel={`Open Approved Plans list (${schedule.approved})`}
          eventName="dashboard.kpi_clicked"
          eventProps={{ kpi: 'latestPlansApproved', value: schedule.approved }}
        />
        <KPICard
          href="/admin/ai-actions?needsReview=true"
          title="AI Actions Pending"
          value={4}
          delta="Needs your review"
          deltaType="warning"
          icon={AIIcon}
          iconBg="bg-amber-500/10"
          iconColor="text-amber-400"
          ariaLabel="Open AI Actions needing review (4)"
          eventName="dashboard.kpi_clicked"
          eventProps={{ kpi: 'aiActionsNeedsReview', value: 4 }}
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 min-w-0">
        {/* Recent AI Actions */}
        <div className="lg:col-span-2 card w-full max-w-full overflow-hidden min-w-0">
          <SectionHeader title="Recent AI Actions" viewAllHref="/admin/ai-actions" viewAllLabel="View all AI Actions" />
          <div className="divide-y divide-slate-800">
            {recentAIActions.map((action) => (
              <Link
                key={action.id}
                href={`/admin/ai-actions/${action.id}`}
                className="p-4 flex items-center gap-4 hover:bg-slate-800/50 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-500 min-h-[64px]"
                aria-label={`View ${action.title} - ${action.status}`}
              >
                <div className={`h-10 w-10 rounded-lg ${action.statusBg} flex items-center justify-center shrink-0`}>
                  <action.icon className={`h-5 w-5 ${action.statusColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{action.title}</p>
                  <p className="text-xs text-slate-500 truncate">{action.description}</p>
                </div>
                <span className={`badge shrink-0 ${action.badgeClass}`}>{action.status}</span>
                <ChevronRightIcon className="h-4 w-4 text-slate-500 shrink-0" />
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="card w-full max-w-full overflow-hidden min-w-0">
          <SectionHeader title="Today's Tasks" viewAllHref="/taskflow?due=today" viewAllLabel="View all tasks due today" />
          <div className="divide-y divide-slate-800">
            {recentTasks.map((task) => (
              <Link
                key={task.id}
                href={`/taskflow/${task.id}`}
                className="p-4 flex items-center gap-3 hover:bg-slate-800/50 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-500 min-h-[56px]"
                aria-label={`View task: ${task.title} - ${task.status}`}
              >
                <div className={`h-8 w-8 rounded-lg ${task.statusBg} flex items-center justify-center shrink-0`}>
                  <TaskIcon className={`h-4 w-4 ${task.statusColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{task.title}</p>
                  <p className="text-xs text-slate-500">{task.dueTime}</p>
                </div>
                <span className={`badge text-xs shrink-0 ${task.badgeClass}`}>{task.status}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card w-full max-w-full overflow-hidden min-w-0">
        <SectionHeader title="Quick Actions" />
        <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickAction href="/taskflow/new" icon={PlusIcon}>
            Create Task
          </QuickAction>
          <QuickAction href="/meetingflow" icon={MicIcon}>
            Start Recording
          </QuickAction>
          <QuickAction href="/documents" icon={UploadIcon}>
            Upload Document
          </QuickAction>
          <QuickAction href="/admin/team" icon={UserPlusIcon}>
            Manage Team
          </QuickAction>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Components
// ============================================================================

/**
 * KPI Card - Fully clickable card that navigates to a filtered list view
 * Per PRD: All KPI cards must be clickable and route to pre-filtered detail views
 * 
 * @todo Telemetry events are logged to console in dev; integrate with PostHog in production
 */
function KPICard({
  href,
  title,
  value,
  delta,
  deltaType,
  icon: Icon,
  iconBg,
  iconColor,
  ariaLabel,
  eventName,
  eventProps,
}: {
  href: string;
  title: string;
  value: number;
  delta: string;
  deltaType: "positive" | "negative" | "neutral" | "warning";
  icon: React.FC<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  ariaLabel: string;
  eventName?: string;
  eventProps?: Record<string, unknown>;
}) {
  const deltaColors = {
    positive: "text-emerald-400",
    negative: "text-red-400",
    neutral: "text-slate-400",
    warning: "text-amber-400",
  };

  const handleClick = () => {
    if (eventName) {
      trackEvent(eventName, eventProps);
    }
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      className="card p-4 sm:p-5 w-full max-w-full overflow-hidden min-w-0 group hover:border-slate-700 hover:bg-slate-800/30 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900"
      aria-label={ariaLabel}
      role="link"
    >
      <div className="flex items-center gap-3 sm:gap-4">
        <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-xl ${iconBg} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
          <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm text-slate-400 truncate">{title}</p>
          <p className="text-xl sm:text-2xl font-bold">{value}</p>
        </div>
        <ChevronRightIcon className="h-5 w-5 text-slate-500 group-hover:text-cyan-400 transition-colors shrink-0" />
      </div>
      <p className={`text-xs mt-2 sm:mt-3 truncate ${deltaColors[deltaType]}`}>{delta}</p>
    </Link>
  );
}

/**
 * Section Header - Title with optional "View all" link
 * Per PRD: Each section must have a visible "View all" link
 */
function SectionHeader({
  title,
  viewAllHref,
  viewAllLabel,
}: {
  title: string;
  viewAllHref?: string;
  viewAllLabel?: string;
}) {
  return (
    <div className="card-header flex items-center justify-between">
      <h2 className="font-semibold">{title}</h2>
      {viewAllHref && (
        <Link
          href={viewAllHref}
          className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors focus:outline-none focus:underline min-h-[44px] min-w-[44px] flex items-center justify-end"
          aria-label={viewAllLabel || `View all ${title}`}
        >
          View all
        </Link>
      )}
    </div>
  );
}

/**
 * Quick Action - Button-style link for common actions
 * Per PRD: Tap targets must be >= 44x44px
 */
function QuickAction({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: React.FC<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg border border-slate-800 hover:border-slate-700 hover:bg-slate-800/50 transition-colors min-h-[80px] focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900"
    >
      <Icon className="h-6 w-6 text-slate-400" />
      <span className="text-xs sm:text-sm font-medium text-center">{children}</span>
    </Link>
  );
}

// ============================================================================
// Icons
// ============================================================================

function OverdueIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function TaskIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
}

function AIIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function MeetingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function ScheduleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function MicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  );
}

function UserPlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

// ============================================================================
// Mock Data - Replace with API data in production
// ============================================================================

const recentAIActions = [
  {
    id: "ai-1",
    title: "Daily Plan Generated",
    description: "TaskFlow • 5 tasks prioritized for today",
    status: "Needs Review",
    badgeClass: "badge-warning",
    icon: TaskIcon,
    statusBg: "bg-amber-500/10",
    statusColor: "text-amber-400",
  },
  {
    id: "ai-2",
    title: "Meeting Summary Created",
    description: "MeetingFlow • Project kickoff meeting",
    status: "Approved",
    badgeClass: "badge-success",
    icon: MeetingIcon,
    statusBg: "bg-emerald-500/10",
    statusColor: "text-emerald-400",
  },
  {
    id: "ai-3",
    title: "Follow-up Email Drafted",
    description: "CloserFlow • Lead: Acme Construction",
    status: "Needs Review",
    badgeClass: "badge-warning",
    icon: AIIcon,
    statusBg: "bg-amber-500/10",
    statusColor: "text-amber-400",
  },
];

const recentTasks = [
  {
    id: "task-1",
    title: "Review material samples",
    dueTime: "Due at 10:00 AM",
    status: "In Progress",
    badgeClass: "badge-primary",
    statusBg: "bg-cyan-500/10",
    statusColor: "text-cyan-400",
  },
  {
    id: "task-2",
    title: "Update project timeline",
    dueTime: "Due at 2:00 PM",
    status: "Todo",
    badgeClass: "badge-secondary",
    statusBg: "bg-slate-500/10",
    statusColor: "text-slate-400",
  },
  {
    id: "task-3",
    title: "Call subcontractor for quote",
    dueTime: "Due at 4:00 PM",
    status: "Todo",
    badgeClass: "badge-secondary",
    statusBg: "bg-slate-500/10",
    statusColor: "text-slate-400",
  },
];