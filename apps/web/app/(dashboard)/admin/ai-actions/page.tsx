export default function AIActionsPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Action Log</h1>
          <p className="text-slate-400 mt-1">Review and approve AI-generated content before external actions</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="input w-auto text-sm">
            <option value="all">All Status</option>
            <option value="proposed">Needs Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <button className="btn-secondary text-sm">
            <FilterIcon className="h-4 w-4" />
            Filters
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-sm text-slate-400">Pending Review</p>
          <p className="text-2xl font-bold text-amber-400">8</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-slate-400">Approved Today</p>
          <p className="text-2xl font-bold text-emerald-400">24</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-slate-400">Rejected Today</p>
          <p className="text-2xl font-bold text-red-400">2</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-slate-400">Total Cost Today</p>
          <p className="text-2xl font-bold">$4.82</p>
        </div>
      </div>

      {/* Actions table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800 text-left">
                <th className="px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Action</th>
                <th className="px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Model</th>
                <th className="px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Actor</th>
                <th className="px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Tokens</th>
                <th className="px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Cost</th>
                <th className="px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Time</th>
                <th className="px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {mockActions.map((action) => (
                <tr key={action.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-lg ${action.iconBg} flex items-center justify-center`}>
                        <action.icon className={`h-4 w-4 ${action.iconColor}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{action.title}</p>
                        <p className="text-xs text-slate-500">{action.outputKind}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-slate-300">{action.model}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-slate-700 flex items-center justify-center text-xs">
                        {action.actor[0]}
                      </div>
                      <span className="text-sm text-slate-300">{action.actor}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`badge ${action.statusBadge}`}>
                      {action.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-slate-400">{action.tokens.toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-slate-400">${action.cost.toFixed(4)}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-slate-500">{action.time}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      {action.status === "Needs Review" && (
                        <>
                          <button className="btn-primary text-xs px-3 py-1.5">Approve</button>
                          <button className="btn-ghost text-xs px-3 py-1.5 text-red-400 hover:text-red-300">Reject</button>
                        </>
                      )}
                      <button className="btn-ghost text-xs px-2 py-1.5">
                        <EyeIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="border-t border-slate-800 px-4 py-3 flex items-center justify-between">
          <p className="text-sm text-slate-500">Showing 1-10 of 156 actions</p>
          <div className="flex items-center gap-2">
            <button className="btn-ghost text-sm" disabled>Previous</button>
            <button className="btn-ghost text-sm">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Icons
function FilterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function TaskIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}

function MeetingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
    </svg>
  );
}

function EmailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

// Mock data
const mockActions = [
  {
    id: "1",
    title: "Daily Plan Generation",
    outputKind: "structured",
    model: "gpt-4o",
    actor: "John Smith",
    status: "Needs Review",
    statusBadge: "badge-warning",
    tokens: 2456,
    cost: 0.0245,
    time: "2 min ago",
    icon: TaskIcon,
    iconBg: "bg-cyan-500/10",
    iconColor: "text-cyan-400",
  },
  {
    id: "2",
    title: "Meeting Summary",
    outputKind: "text",
    model: "gpt-4o",
    actor: "Jane Doe",
    status: "Approved",
    statusBadge: "badge-success",
    tokens: 1823,
    cost: 0.0182,
    time: "15 min ago",
    icon: MeetingIcon,
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-400",
  },
  {
    id: "3",
    title: "Follow-up Email Draft",
    outputKind: "text",
    model: "gpt-4o",
    actor: "John Smith",
    status: "Needs Review",
    statusBadge: "badge-warning",
    tokens: 892,
    cost: 0.0089,
    time: "32 min ago",
    icon: EmailIcon,
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-400",
  },
  {
    id: "4",
    title: "Document Extraction",
    outputKind: "json",
    model: "gpt-4o-vision",
    actor: "System",
    status: "Approved",
    statusBadge: "badge-success",
    tokens: 3241,
    cost: 0.0648,
    time: "1 hour ago",
    icon: DocumentIcon,
    iconBg: "bg-rose-500/10",
    iconColor: "text-rose-400",
  },
  {
    id: "5",
    title: "Task Creation from Voice",
    outputKind: "structured",
    model: "whisper-1 + gpt-4o",
    actor: "Mike Wilson",
    status: "Rejected",
    statusBadge: "badge-error",
    tokens: 1567,
    cost: 0.0234,
    time: "2 hours ago",
    icon: TaskIcon,
    iconBg: "bg-red-500/10",
    iconColor: "text-red-400",
  },
];

