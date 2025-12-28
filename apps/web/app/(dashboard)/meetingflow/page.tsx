"use client";

import { useState, useMemo } from "react";

type MeetingStatus = "all" | "pending_review" | "transcribing" | "completed";
type ProjectFilter = "" | "acme" | "sunset" | "downtown";

export default function MeetingFlowPage() {
  const [statusFilter, setStatusFilter] = useState<MeetingStatus>("all");
  const [projectFilter, setProjectFilter] = useState<ProjectFilter>("");

  const filteredMeetings = useMemo(() => {
    return mockMeetings.filter((meeting) => {
      // Status filter
      if (statusFilter !== "all" && meeting.status !== statusFilter) {
        return false;
      }
      // Project filter
      if (projectFilter) {
        const projectMap: Record<string, string[]> = {
          acme: ["Acme Office Build"],
          sunset: ["Sunset Apartments"],
          downtown: ["Downtown Plaza"],
        };
        if (!projectMap[projectFilter]?.includes(meeting.project || "")) {
          return false;
        }
      }
      return true;
    });
  }, [statusFilter, projectFilter]);

  // Calculate stats based on all meetings (not filtered)
  const stats = useMemo(() => {
    const totalMeetings = mockMeetings.length;
    const pendingReview = mockMeetings.filter(m => m.status === "pending_review").length;
    const totalHours = mockMeetings.reduce((acc, m) => {
      const match = m.duration.match(/(\d+)h?\s*(\d+)?/);
      if (match) {
        const hours = match[1].includes("h") ? parseInt(match[1]) : 0;
        const mins = match[2] ? parseInt(match[2]) : parseInt(match[1]);
        return acc + hours + mins / 60;
      }
      return acc;
    }, 0);
    const actionItems = mockMeetings.reduce((acc, m) => acc + (m.actionItems || 0), 0);
    
    return { totalMeetings, pendingReview, totalHours: totalHours.toFixed(1), actionItems };
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">MeetingFlow</h1>
          <p className="text-slate-400 mt-1">Record, transcribe, and summarize meetings with AI</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-secondary">
            <UploadIcon className="h-4 w-4" />
            Upload Recording
          </button>
          <button className="btn-primary">
            <MicIcon className="h-4 w-4" />
            Start Recording
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-sm text-slate-400">Total Meetings</p>
          <p className="text-2xl font-bold">{stats.totalMeetings}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-slate-400">Pending Review</p>
          <p className="text-2xl font-bold text-amber-400">{stats.pendingReview}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-slate-400">Hours Transcribed</p>
          <p className="text-2xl font-bold">{stats.totalHours}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-slate-400">Action Items Created</p>
          <p className="text-2xl font-bold text-emerald-400">{stats.actionItems}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 border border-slate-700 rounded-lg p-1">
          <FilterButton 
            active={statusFilter === "all"} 
            onClick={() => setStatusFilter("all")}
          >
            All
          </FilterButton>
          <FilterButton 
            active={statusFilter === "pending_review"} 
            onClick={() => setStatusFilter("pending_review")}
          >
            Pending Review
          </FilterButton>
          <FilterButton 
            active={statusFilter === "transcribing"} 
            onClick={() => setStatusFilter("transcribing")}
          >
            Transcribing
          </FilterButton>
          <FilterButton 
            active={statusFilter === "completed"} 
            onClick={() => setStatusFilter("completed")}
          >
            Completed
          </FilterButton>
        </div>
        <select 
          className="input w-auto text-sm"
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value as ProjectFilter)}
        >
          <option value="">All Projects</option>
          <option value="acme">Acme Office Build</option>
          <option value="sunset">Sunset Apartments</option>
          <option value="downtown">Downtown Plaza</option>
        </select>
        
        {/* Clear filters button */}
        {(statusFilter !== "all" || projectFilter) && (
          <button 
            className="text-sm text-slate-400 hover:text-white transition-colors"
            onClick={() => {
              setStatusFilter("all");
              setProjectFilter("");
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Results count */}
      <div className="text-sm text-slate-400">
        Showing {filteredMeetings.length} of {mockMeetings.length} meetings
      </div>

      {/* Meetings list */}
      <div className="space-y-4">
        {filteredMeetings.map((meeting) => (
          <MeetingCard key={meeting.id} meeting={meeting} />
        ))}
      </div>

      {/* Empty state when no results */}
      {filteredMeetings.length === 0 && mockMeetings.length > 0 && (
        <div className="card p-12 text-center">
          <div className="h-16 w-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <SearchIcon className="h-8 w-8 text-slate-500" />
          </div>
          <h3 className="text-lg font-medium mb-2">No matching meetings</h3>
          <p className="text-slate-400 mb-6 max-w-sm mx-auto">
            Try adjusting your filters to find what you&apos;re looking for
          </p>
          <button 
            className="btn-secondary"
            onClick={() => {
              setStatusFilter("all");
              setProjectFilter("");
            }}
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}

// Components
function FilterButton({ 
  children, 
  active, 
  onClick 
}: { 
  children: React.ReactNode; 
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
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

function MeetingCard({ meeting }: { meeting: typeof mockMeetings[0] }) {
  const statusConfig = {
    pending_review: { badge: "badge-warning", label: "Pending Review" },
    transcribing: { badge: "badge-info", label: "Transcribing" },
    completed: { badge: "badge-success", label: "Completed" },
    recording: { badge: "bg-red-500/10 text-red-400 ring-1 ring-inset ring-red-500/20", label: "Recording" },
  };

  const status = statusConfig[meeting.status as keyof typeof statusConfig] || statusConfig.completed;

  return (
    <div className="card p-5 hover:border-slate-700 transition-colors">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`h-12 w-12 rounded-xl ${meeting.iconBg} flex items-center justify-center flex-shrink-0`}>
          <MeetingIcon className={`h-6 w-6 ${meeting.iconColor}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="font-semibold text-lg">{meeting.title}</h3>
            <span className={`badge ${status.badge}`}>{status.label}</span>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-slate-400 mb-3">
            <span className="flex items-center gap-1.5">
              <CalendarIcon className="h-4 w-4" />
              {meeting.date}
            </span>
            <span className="flex items-center gap-1.5">
              <ClockIcon className="h-4 w-4" />
              {meeting.duration}
            </span>
            <span className="flex items-center gap-1.5">
              <UsersIcon className="h-4 w-4" />
              {meeting.participants} participants
            </span>
            {meeting.project && (
              <span className="flex items-center gap-1.5">
                <FolderIcon className="h-4 w-4" />
                {meeting.project}
              </span>
            )}
          </div>

          {/* Progress or summary */}
          {meeting.status === "transcribing" && (
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-400">Transcribing...</span>
                <span className="text-cyan-400">{meeting.progress}%</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all"
                  style={{ width: `${meeting.progress}%` }}
                />
              </div>
            </div>
          )}

          {meeting.summary && (
            <p className="text-sm text-slate-400 line-clamp-2 mb-3">{meeting.summary}</p>
          )}

          {/* Action items preview */}
          {meeting.actionItems && meeting.actionItems > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="badge badge-info">
                {meeting.actionItems} action items
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {meeting.status === "pending_review" && (
            <button className="btn-primary text-sm">
              Review
            </button>
          )}
          <button className="btn-ghost p-2">
            <PlayIcon className="h-5 w-5" />
          </button>
          <button className="btn-ghost p-2">
            <DotsIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Icons
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

function MeetingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
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

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

// Mock data
const mockMeetings = [
  {
    id: "1",
    title: "Project Kickoff - Acme Office Build",
    date: "Dec 28, 2025 • 10:00 AM",
    duration: "45 min",
    participants: 4,
    project: "Acme Office Build",
    status: "pending_review",
    summary: "Discussed project timeline, key milestones, and resource allocation. Client emphasized importance of meeting the March deadline for Phase 1.",
    actionItems: 5,
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-400",
    progress: undefined,
  },
  {
    id: "2",
    title: "Site Walk with Subcontractor",
    date: "Dec 27, 2025 • 2:30 PM",
    duration: "32 min",
    participants: 3,
    project: "Sunset Apartments",
    status: "transcribing",
    progress: 67,
    iconBg: "bg-cyan-500/10",
    iconColor: "text-cyan-400",
    summary: undefined,
    actionItems: undefined,
  },
  {
    id: "3",
    title: "Weekly Progress Review",
    date: "Dec 26, 2025 • 9:00 AM",
    duration: "1h 12min",
    participants: 6,
    project: "Acme Office Build",
    status: "completed",
    summary: "Reviewed progress on HVAC installation and electrical work. On track for Phase 1 completion. Minor delay on material delivery addressed.",
    actionItems: 8,
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-400",
    progress: undefined,
  },
  {
    id: "4",
    title: "Client Design Review",
    date: "Dec 24, 2025 • 11:00 AM",
    duration: "55 min",
    participants: 5,
    project: "Downtown Plaza",
    status: "completed",
    summary: "Client approved final design changes for lobby area. Requested minor modifications to lighting fixtures.",
    actionItems: 3,
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-400",
    progress: undefined,
  },
];
