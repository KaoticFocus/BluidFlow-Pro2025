import Link from "next/link";

export default function TaskFlowPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">TaskFlow</h1>
          <p className="text-slate-400 mt-1">Manage tasks from voice, photo, or text with AI-powered daily plans</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/taskflow/daily-plan" className="btn-secondary">
            <CalendarIcon className="h-4 w-4" />
            Daily Plan
          </Link>
          <Link href="/taskflow/new" className="btn-primary">
            <PlusIcon className="h-4 w-4" />
            New Task
          </Link>
        </div>
      </div>

      {/* Quick input */}
      <div className="card p-4">
        <div className="flex items-center gap-4">
          <button className="h-12 w-12 rounded-xl bg-cyan-500/10 flex items-center justify-center hover:bg-cyan-500/20 transition-colors">
            <MicIcon className="h-6 w-6 text-cyan-400" />
          </button>
          <button className="h-12 w-12 rounded-xl bg-violet-500/10 flex items-center justify-center hover:bg-violet-500/20 transition-colors">
            <CameraIcon className="h-6 w-6 text-violet-400" />
          </button>
          <div className="flex-1">
            <input
              type="text"
              placeholder="Quick add a task..."
              className="input"
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 border border-slate-700 rounded-lg p-1">
          <FilterButton active>All Tasks</FilterButton>
          <FilterButton>Open</FilterButton>
          <FilterButton>In Progress</FilterButton>
          <FilterButton>Completed</FilterButton>
        </div>
        <select className="input w-auto text-sm">
          <option value="">All Sources</option>
          <option value="voice">Voice</option>
          <option value="photo">Photo</option>
          <option value="message">Message</option>
          <option value="manual">Manual</option>
        </select>
        <select className="input w-auto text-sm">
          <option value="">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Tasks list */}
      <div className="space-y-3">
        {mockTasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>

      {/* Empty state (hidden when tasks exist) */}
      {mockTasks.length === 0 && (
        <div className="card p-12 text-center">
          <div className="h-16 w-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <TaskIcon className="h-8 w-8 text-slate-500" />
          </div>
          <h3 className="text-lg font-medium mb-2">No tasks yet</h3>
          <p className="text-slate-400 mb-6 max-w-sm mx-auto">
            Create your first task using voice, photo, or text input
          </p>
          <Link href="/taskflow/new" className="btn-primary">
            Create Task
          </Link>
        </div>
      )}
    </div>
  );
}

// Components
function FilterButton({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <button
      className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
        active
          ? "bg-slate-700 text-white"
          : "text-slate-400 hover:text-white hover:bg-slate-800"
      }`}
    >
      {children}
    </button>
  );
}

function TaskCard({ task }: { task: typeof mockTasks[0] }) {
  const priorityColors = {
    urgent: "border-l-red-500",
    high: "border-l-amber-500",
    normal: "border-l-blue-500",
    low: "border-l-slate-500",
  };

  const statusColors = {
    open: "badge-info",
    in_progress: "badge-warning",
    completed: "badge-success",
  };

  const sourceIcons = {
    voice: MicIcon,
    photo: CameraIcon,
    message: MessageIcon,
    manual: PencilIcon,
  };

  const SourceIcon = sourceIcons[task.source as keyof typeof sourceIcons] || TaskIcon;

  return (
    <div className={`card p-4 border-l-4 ${priorityColors[task.priority as keyof typeof priorityColors]} hover:border-slate-700 transition-colors`}>
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <button className={`mt-1 h-5 w-5 rounded border ${
          task.status === "completed" 
            ? "bg-emerald-500 border-emerald-500" 
            : "border-slate-600 hover:border-slate-500"
        } flex items-center justify-center transition-colors`}>
          {task.status === "completed" && (
            <CheckIcon className="h-3 w-3 text-white" />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`font-medium ${task.status === "completed" ? "line-through text-slate-500" : ""}`}>
              {task.title}
            </h3>
            {task.aiGenerated && (
              <span className="badge badge-info">AI</span>
            )}
          </div>
          {task.description && (
            <p className="text-sm text-slate-400 mb-2">{task.description}</p>
          )}
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <SourceIcon className="h-3.5 w-3.5" />
              {task.source}
            </span>
            {task.dueDate && (
              <span className="flex items-center gap-1">
                <CalendarIcon className="h-3.5 w-3.5" />
                {task.dueDate}
              </span>
            )}
            {task.project && (
              <span className="flex items-center gap-1">
                <FolderIcon className="h-3.5 w-3.5" />
                {task.project}
              </span>
            )}
          </div>
        </div>

        {/* Status & actions */}
        <div className="flex items-center gap-3">
          <span className={`badge ${statusColors[task.status as keyof typeof statusColors]}`}>
            {task.status.replace("_", " ")}
          </span>
          <button className="btn-ghost p-1.5">
            <DotsIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
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

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
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

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function MessageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
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

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
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
const mockTasks = [
  {
    id: "1",
    title: "Install new HVAC units on 3rd floor",
    description: "Client requested units before Friday inspection",
    source: "voice",
    status: "in_progress",
    priority: "high",
    project: "Acme Office Build",
    dueDate: "Dec 30",
    aiGenerated: true,
  },
  {
    id: "2",
    title: "Review electrical panel photos",
    description: null,
    source: "photo",
    status: "open",
    priority: "normal",
    project: "Acme Office Build",
    dueDate: "Dec 31",
    aiGenerated: false,
  },
  {
    id: "3",
    title: "Order replacement windows for unit 204",
    description: "Measurements confirmed: 48x60 double-hung",
    source: "message",
    status: "open",
    priority: "urgent",
    project: "Sunset Apartments",
    dueDate: "Dec 29",
    aiGenerated: true,
  },
  {
    id: "4",
    title: "Schedule final walkthrough with inspector",
    description: null,
    source: "manual",
    status: "completed",
    priority: "normal",
    project: "Acme Office Build",
    dueDate: "Dec 28",
    aiGenerated: false,
  },
];

