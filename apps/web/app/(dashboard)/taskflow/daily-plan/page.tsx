import Link from "next/link";

export default function DailyPlanPage() {
  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link href="/taskflow" className="text-sm text-slate-400 hover:text-slate-300 mb-2 inline-flex items-center gap-1 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900">
            <ArrowLeftIcon className="h-4 w-4" />
            Back to TaskFlow
          </Link>
          <h1 className="text-2xl font-bold mt-2">Daily Plan</h1>
          <p className="text-slate-400 mt-1">AI-generated prioritized task list for today</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button className="btn-secondary min-h-[44px] px-4">
            <RefreshIcon className="h-4 w-4" />
            Regenerate
          </button>
          <button className="btn-primary min-h-[44px] px-4">
            <CheckIcon className="h-4 w-4" />
            Approve Plan
          </button>
        </div>
      </div>

      {/* Date selector */}
      <div className="flex items-center gap-4">
        <button className="btn-ghost p-2">
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-slate-400" />
          <span className="font-medium">Sunday, December 28, 2025</span>
          <span className="badge badge-info">Today</span>
        </div>
        <button className="btn-ghost p-2">
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Plan status */}
      <div className="card p-4 flex items-center gap-4 bg-amber-500/5 border-amber-500/20">
        <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
          <AIIcon className="h-5 w-5 text-amber-400" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-amber-400">Pending Approval</p>
          <p className="text-sm text-slate-400">This AI-generated plan needs your review before becoming active</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span>Generated 5 min ago</span>
          <span>•</span>
          <span>5 tasks prioritized</span>
        </div>
      </div>

      {/* Plan summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-sm text-slate-400 mb-1">Total Tasks</p>
          <p className="text-2xl font-bold">5</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-slate-400 mb-1">Estimated Time</p>
          <p className="text-2xl font-bold">6.5 hours</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-slate-400 mb-1">Priority Tasks</p>
          <p className="text-2xl font-bold text-amber-400">2 urgent</p>
        </div>
      </div>

      {/* Task list */}
      <div className="card overflow-hidden">
        <div className="card-header">
          <h2 className="font-semibold">Prioritized Tasks</h2>
        </div>
        <div className="divide-y divide-slate-800">
          {planTasks.map((task, index) => (
            <div key={task.id} className="p-4 flex items-center gap-4 hover:bg-slate-800/30 transition-colors">
              {/* Priority number */}
              <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${
                index < 2 ? "bg-amber-500/20 text-amber-400" : "bg-slate-700 text-slate-300"
              }`}>
                {index + 1}
              </div>

              {/* Task info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-medium break-words">{task.title}</h3>
                  {task.aiReason && (
                    <span className="badge badge-info text-xs flex-shrink-0">{task.aiReason}</span>
                  )}
                </div>
                <p className="text-sm text-slate-500 mt-0.5 break-words">
                  {task.project} • {task.estimatedTime}
                </p>
              </div>

              {/* Priority badge */}
              <span className={`badge ${priorityBadge(task.priority)}`}>
                {task.priority}
              </span>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button className="btn-ghost p-2 min-h-[44px] min-w-[44px] focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900" aria-label="Move up">
                  <ChevronUpIcon className="h-5 w-5" />
                </button>
                <button className="btn-ghost p-2 min-h-[44px] min-w-[44px] focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900" aria-label="Move down">
                  <ChevronDownIcon className="h-5 w-5" />
                </button>
                <button className="btn-ghost p-2 min-h-[44px] min-w-[44px] focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900" aria-label="Remove from plan">
                  <XIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI reasoning */}
      <div className="card">
        <div className="card-header">
          <h2 className="font-semibold flex items-center gap-2">
            <AIIcon className="h-4 w-4 text-cyan-400" />
            AI Reasoning
          </h2>
        </div>
        <div className="card-body">
          <p className="text-slate-300 leading-relaxed break-words">
            I've prioritized today's tasks based on the following factors:
          </p>
          <ul className="mt-4 space-y-2 text-sm text-slate-400">
            <li className="flex items-start gap-2">
              <CheckIcon className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              <span className="break-words"><strong className="text-slate-300">HVAC installation</strong> is urgent due to Friday's inspection deadline</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckIcon className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              <span className="break-words"><strong className="text-slate-300">Window order</strong> requires immediate attention to meet lead times</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckIcon className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              <span className="break-words">Grouped tasks by project location to minimize travel time</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckIcon className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              <span className="break-words">Total estimated time (6.5 hours) fits within standard work day</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// Helpers
function priorityBadge(priority: string) {
  const badges: Record<string, string> = {
    urgent: "badge-error",
    high: "badge-warning",
    normal: "badge-info",
    low: "bg-slate-500/10 text-slate-400 ring-1 ring-inset ring-slate-500/20",
  };
  return badges[priority] || badges.normal;
}

// Icons
function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
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

function ChevronUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
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

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

// Mock data
const planTasks = [
  {
    id: "1",
    title: "Install new HVAC units on 3rd floor",
    project: "Acme Office Build",
    estimatedTime: "3 hours",
    priority: "urgent",
    aiReason: "Deadline Friday",
  },
  {
    id: "2",
    title: "Order replacement windows for unit 204",
    project: "Sunset Apartments",
    estimatedTime: "30 min",
    priority: "urgent",
    aiReason: "Long lead time",
  },
  {
    id: "3",
    title: "Review electrical panel photos",
    project: "Acme Office Build",
    estimatedTime: "1 hour",
    priority: "high",
    aiReason: null,
  },
  {
    id: "4",
    title: "Update project timeline in system",
    project: "Downtown Plaza",
    estimatedTime: "45 min",
    priority: "normal",
    aiReason: null,
  },
  {
    id: "5",
    title: "Send weekly progress report to client",
    project: "Acme Office Build",
    estimatedTime: "1 hour",
    priority: "normal",
    aiReason: null,
  },
];

