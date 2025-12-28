import Link from "next/link";

export default function TeamPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team</h1>
          <p className="text-slate-400 mt-1">Manage team members and their roles</p>
        </div>
        <button className="btn-primary">
          <PlusIcon className="h-4 w-4" />
          Invite Member
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-sm text-slate-400">Total Members</p>
          <p className="text-2xl font-bold">15</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-slate-400">Active Now</p>
          <p className="text-2xl font-bold text-emerald-400">12</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-slate-400">Pending Invites</p>
          <p className="text-2xl font-bold text-amber-400">3</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-slate-400">Roles</p>
          <p className="text-2xl font-bold">5</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800">
        <Tab active>Members</Tab>
        <Tab>Invitations</Tab>
        <Tab>Roles</Tab>
      </div>

      {/* Members table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800 text-left">
                <th className="px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Member</th>
                <th className="px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Last Active</th>
                <th className="px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {mockMembers.map((member) => (
                <tr key={member.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full ${member.avatarBg} flex items-center justify-center font-medium`}>
                        {member.initials}
                      </div>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-slate-500">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`badge ${member.roleBadge}`}>{member.role}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`status-dot ${member.isOnline ? "status-dot-success" : "bg-slate-600"}`} />
                      <span className="text-sm">{member.isOnline ? "Online" : "Offline"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-slate-400">{member.lastActive}</span>
                  </td>
                  <td className="px-4 py-4">
                    <button className="btn-ghost p-1.5">
                      <DotsIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite modal would go here */}
    </div>
  );
}

// Components
function Tab({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <button
      className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
        active
          ? "border-cyan-500 text-white"
          : "border-transparent text-slate-400 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

// Icons
function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function DotsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
    </svg>
  );
}

// Mock data
const mockMembers = [
  {
    id: "1",
    name: "John Smith",
    email: "john@acmeconstruction.com",
    initials: "JS",
    avatarBg: "bg-cyan-500/20 text-cyan-400",
    role: "Owner",
    roleBadge: "bg-violet-500/10 text-violet-400 ring-1 ring-inset ring-violet-500/20",
    isOnline: true,
    lastActive: "Now",
  },
  {
    id: "2",
    name: "Jane Doe",
    email: "jane@acmeconstruction.com",
    initials: "JD",
    avatarBg: "bg-emerald-500/20 text-emerald-400",
    role: "Admin",
    roleBadge: "bg-blue-500/10 text-blue-400 ring-1 ring-inset ring-blue-500/20",
    isOnline: true,
    lastActive: "2 min ago",
  },
  {
    id: "3",
    name: "Mike Wilson",
    email: "mike@acmeconstruction.com",
    initials: "MW",
    avatarBg: "bg-amber-500/20 text-amber-400",
    role: "Field Tech",
    roleBadge: "bg-amber-500/10 text-amber-400 ring-1 ring-inset ring-amber-500/20",
    isOnline: true,
    lastActive: "15 min ago",
  },
  {
    id: "4",
    name: "Sarah Johnson",
    email: "sarah@acmeconstruction.com",
    initials: "SJ",
    avatarBg: "bg-rose-500/20 text-rose-400",
    role: "Sales",
    roleBadge: "bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20",
    isOnline: false,
    lastActive: "3 hours ago",
  },
  {
    id: "5",
    name: "Client Portal User",
    email: "client@bigcorp.com",
    initials: "CP",
    avatarBg: "bg-slate-500/20 text-slate-400",
    role: "Client",
    roleBadge: "bg-slate-500/10 text-slate-400 ring-1 ring-inset ring-slate-500/20",
    isOnline: false,
    lastActive: "Yesterday",
  },
];

