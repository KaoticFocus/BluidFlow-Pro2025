export default function DashboardPage() {
  return (
    <div className="p-4 sm:p-6 space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-slate-400 mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Open Tasks"
          value="24"
          change="+3 from yesterday"
          changeType="neutral"
          icon={TaskIcon}
          iconBg="bg-cyan-500/10"
          iconColor="text-cyan-400"
        />
        <StatCard
          title="Pending Approvals"
          value="8"
          change="4 AI actions need review"
          changeType="warning"
          icon={AIIcon}
          iconBg="bg-amber-500/10"
          iconColor="text-amber-400"
        />
        <StatCard
          title="Today's Meetings"
          value="3"
          change="Next: Project standup @ 2pm"
          changeType="neutral"
          icon={MeetingIcon}
          iconBg="bg-violet-500/10"
          iconColor="text-violet-400"
        />
        <StatCard
          title="Team Online"
          value="12"
          change="of 15 members"
          changeType="positive"
          icon={UsersIcon}
          iconBg="bg-emerald-500/10"
          iconColor="text-emerald-400"
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent AI Actions */}
        <div className="lg:col-span-2 card">
          <div className="card-header flex items-center justify-between">
            <h2 className="font-semibold">Recent AI Actions</h2>
            <a href="/admin/ai-actions" className="text-sm text-cyan-400 hover:text-cyan-300">
              View all
            </a>
          </div>
          <div className="divide-y divide-slate-800">
            {aiActions.map((action) => (
              <div key={action.id} className="p-4 flex items-center gap-4">
                <div className={`h-10 w-10 rounded-lg ${action.statusBg} flex items-center justify-center`}>
                  <action.icon className={`h-5 w-5 ${action.statusColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium break-words">{action.title}</p>
                  <p className="text-xs text-slate-500 break-words">{action.description}</p>
                </div>
                <span className={`badge ${action.badgeClass}`}>{action.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold">Quick Actions</h2>
          </div>
          <div className="p-4 space-y-2">
            <QuickAction href="/taskflow/new" icon={PlusIcon}>
              Create Task
            </QuickAction>
            <QuickAction href="/meetingflow/new" icon={MicIcon}>
              Start Recording
            </QuickAction>
            <QuickAction href="/documents/upload" icon={UploadIcon}>
              Upload Document
            </QuickAction>
            <QuickAction href="/admin/team/invite" icon={UserPlusIcon}>
              Invite Team Member
            </QuickAction>
          </div>
        </div>
      </div>
    </div>
  );
}

// Components
function StatCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  iconBg,
  iconColor,
}: {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral" | "warning";
  icon: React.FC<{ className?: string }>;
  iconBg: string;
  iconColor: string;
}) {
  const changeColors = {
    positive: "text-emerald-400",
    negative: "text-red-400",
    neutral: "text-slate-400",
    warning: "text-amber-400",
  };

  return (
    <div className="card p-5">
      <div className="flex items-center gap-4">
        <div className={`h-12 w-12 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
      <p className={`text-xs mt-3 ${changeColors[changeType]}`}>{change}</p>
    </div>
  );
}

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
    <a
      href={href}
      className="flex items-center gap-3 px-4 py-3 rounded-lg border border-slate-800 hover:border-slate-700 hover:bg-slate-800/50 transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900"
    >
      <Icon className="h-5 w-5 text-slate-400" />
      <span className="text-sm font-medium">{children}</span>
    </a>
  );
}

// Icons
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
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
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

// Mock data
const aiActions = [
  {
    id: "1",
    title: "Daily Plan Generated",
    description: "TaskFlow • 5 tasks prioritized for today",
    status: "Needs Review",
    badgeClass: "badge-warning",
    icon: TaskIcon,
    statusBg: "bg-amber-500/10",
    statusColor: "text-amber-400",
  },
  {
    id: "2",
    title: "Meeting Summary Created",
    description: "MeetingFlow • Project kickoff meeting",
    status: "Approved",
    badgeClass: "badge-success",
    icon: MeetingIcon,
    statusBg: "bg-emerald-500/10",
    statusColor: "text-emerald-400",
  },
  {
    id: "3",
    title: "Follow-up Email Drafted",
    description: "CloserFlow • Lead: Acme Construction",
    status: "Needs Review",
    badgeClass: "badge-warning",
    icon: AIIcon,
    statusBg: "bg-amber-500/10",
    statusColor: "text-amber-400",
  },
];

