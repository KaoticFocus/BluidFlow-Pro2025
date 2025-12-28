import Link from "next/link";

export default function NewTaskPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <Link href="/taskflow" className="text-sm text-slate-400 hover:text-slate-300 mb-4 inline-flex items-center gap-1">
          <ArrowLeftIcon className="h-4 w-4" />
          Back to TaskFlow
        </Link>
        <h1 className="text-2xl font-bold mt-4">Create New Task</h1>
        <p className="text-slate-400 mt-1">Add a task from voice, photo, or text</p>
      </div>

      {/* Input method selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <InputMethodCard
          icon={MicIcon}
          title="Voice Input"
          description="Speak your task naturally"
          color="cyan"
          active
        />
        <InputMethodCard
          icon={CameraIcon}
          title="Photo Capture"
          description="Snap a photo of the issue"
          color="violet"
        />
        <InputMethodCard
          icon={PencilIcon}
          title="Manual Entry"
          description="Type your task details"
          color="emerald"
        />
      </div>

      {/* Voice recording interface */}
      <div className="card p-8 mb-8 text-center">
        <div className="relative inline-flex mb-6">
          <div className="absolute inset-0 bg-cyan-500/20 rounded-full animate-ping" />
          <button className="relative h-24 w-24 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-shadow">
            <MicIcon className="h-10 w-10 text-white" />
          </button>
        </div>
        <p className="text-slate-400 mb-2">Tap to start recording</p>
        <p className="text-xs text-slate-500">Speak naturally - AI will extract task details</p>
      </div>

      {/* Manual form (shown when manual entry selected) */}
      <div className="card p-6 space-y-6">
        <h2 className="font-semibold">Task Details</h2>
        
        <div>
          <label htmlFor="title" className="label">Title</label>
          <input
            id="title"
            type="text"
            className="input"
            placeholder="What needs to be done?"
          />
        </div>

        <div>
          <label htmlFor="description" className="label">Description</label>
          <textarea
            id="description"
            rows={3}
            className="input"
            placeholder="Add any additional details..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="project" className="label">Project</label>
            <select id="project" className="input">
              <option value="">Select a project</option>
              <option value="acme">Acme Office Build</option>
              <option value="sunset">Sunset Apartments</option>
              <option value="downtown">Downtown Plaza</option>
            </select>
          </div>

          <div>
            <label htmlFor="priority" className="label">Priority</label>
            <select id="priority" className="input">
              <option value="normal">Normal</option>
              <option value="low">Low</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="assignee" className="label">Assign to</label>
            <select id="assignee" className="input">
              <option value="">Unassigned</option>
              <option value="john">John Smith</option>
              <option value="jane">Jane Doe</option>
              <option value="mike">Mike Wilson</option>
            </select>
          </div>

          <div>
            <label htmlFor="dueDate" className="label">Due Date</label>
            <input
              id="dueDate"
              type="date"
              className="input"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <Link href="/taskflow" className="btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="btn-primary">
            Create Task
          </button>
        </div>
      </div>
    </div>
  );
}

// Components
function InputMethodCard({
  icon: Icon,
  title,
  description,
  color,
  active,
}: {
  icon: React.FC<{ className?: string }>;
  title: string;
  description: string;
  color: "cyan" | "violet" | "emerald";
  active?: boolean;
}) {
  const colorClasses = {
    cyan: {
      bg: "bg-cyan-500/10",
      iconColor: "text-cyan-400",
      ring: "ring-cyan-500",
    },
    violet: {
      bg: "bg-violet-500/10",
      iconColor: "text-violet-400",
      ring: "ring-violet-500",
    },
    emerald: {
      bg: "bg-emerald-500/10",
      iconColor: "text-emerald-400",
      ring: "ring-emerald-500",
    },
  };

  const colors = colorClasses[color];

  return (
    <button
      className={`card p-6 text-left hover:border-slate-700 transition-all ${
        active ? `ring-2 ${colors.ring}` : ""
      }`}
    >
      <div className={`h-12 w-12 rounded-xl ${colors.bg} flex items-center justify-center mb-4`}>
        <Icon className={`h-6 w-6 ${colors.iconColor}`} />
      </div>
      <h3 className="font-medium mb-1">{title}</h3>
      <p className="text-sm text-slate-400">{description}</p>
    </button>
  );
}

// Icons
function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
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

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  );
}

