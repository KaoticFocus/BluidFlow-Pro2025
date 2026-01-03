import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TileGrid } from "@/components/home/TileGrid";
import type { ModuleTileProps } from "@/components/home/ModuleTile";
import { getFeatureFlags, type FeatureFlags } from "@/lib/featureFlags";
import { HomePageClient } from "./HomePageClient";

export const dynamic = "force-dynamic";

interface HomeSummary {
  tasks?: { open: number; overdue: number };
  meetings?: { upcoming: number; pending_review: number };
  leads?: { new: number };
  schedule?: { upcoming_plans: number };
  timeclock?: { active_sessions: number };
  documents?: { pending: number };
  ai?: { pending_review: number };
}

async function getHomeSummary(): Promise<HomeSummary | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";
    const res = await fetch(`${apiUrl}/v1/home/summary`, {
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      // Try fallback route
      const fallback = await fetch(`${apiUrl}/home/summary`, { cache: "no-store" });
      if (!fallback.ok) return null;
      return await fallback.json();
    }
    return await res.json();
  } catch {
    return null;
  }
}

function buildModuleTiles(summary: HomeSummary | null, flags: FeatureFlags): ModuleTileProps[] {
  const tiles: ModuleTileProps[] = [];

  // Tasks
  if (flags.tasks !== false) {
    const badge = summary?.tasks?.overdue || summary?.tasks?.open;
    tiles.push({
      id: "tasks",
      href: "/taskflow",
      title: "Tasks",
      description: "Manage tasks from voice, photo, or text",
      icon: <TaskIcon />,
      iconBg: "bg-cyan-500/10",
      iconColor: "text-cyan-400",
      badge: badge || undefined,
      badgeType: summary?.tasks?.overdue ? "error" : "default",
      comingSoon: flags.tasks === "coming_soon",
    });
  }

  // Meetings
  if (flags.meetings !== false) {
    tiles.push({
      id: "meetings",
      href: "/meetingflow",
      title: "Meetings",
      description: "Record, transcribe, and summarize meetings",
      icon: <MeetingIcon />,
      iconBg: "bg-violet-500/10",
      iconColor: "text-violet-400",
      badge: summary?.meetings?.pending_review || undefined,
      badgeType: summary?.meetings?.pending_review ? "warning" : "default",
      comingSoon: flags.meetings === "coming_soon",
    });
  }

  // Leads
  if (flags.leads !== false) {
    tiles.push({
      id: "leads",
      href: "/leads",
      title: "Leads",
      description: "Track and manage sales leads",
      icon: <LeadsIcon />,
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-400",
      badge: summary?.leads?.new || undefined,
      badgeType: "success",
      comingSoon: flags.leads === "coming_soon",
    });
  }

  // Schedule
  if (flags.schedule !== false) {
    tiles.push({
      id: "schedule",
      href: "/scheduleflow",
      title: "Schedule",
      description: "Create and manage project schedules",
      icon: <ScheduleIcon />,
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-400",
      badge: summary?.schedule?.upcoming_plans || undefined,
      comingSoon: flags.schedule === "coming_soon",
    });
  }

  // Time Clock
  if (flags.timeclock !== false) {
    tiles.push({
      id: "timeclock",
      href: "/timeclockflow",
      title: "Time Clock",
      description: "Track time and attendance",
      icon: <ClockIcon />,
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-400",
      badge: summary?.timeclock?.active_sessions || undefined,
      badgeType: summary?.timeclock?.active_sessions ? "success" : "default",
      comingSoon: flags.timeclock === "coming_soon",
    });
  }

  // Documents
  if (flags.documents !== false) {
    tiles.push({
      id: "documents",
      href: "/documents",
      title: "Documents",
      description: "Store and manage project documents",
      icon: <DocumentIcon />,
      iconBg: "bg-slate-500/10",
      iconColor: "text-slate-400",
      badge: summary?.documents?.pending || undefined,
      comingSoon: flags.documents === "coming_soon",
    });
  }

  // AI Actions
  if (flags.ai !== false) {
    tiles.push({
      id: "ai",
      href: "/admin/ai-actions",
      title: "AI Actions",
      description: "Review AI-generated content and actions",
      icon: <AIIcon />,
      iconBg: "bg-pink-500/10",
      iconColor: "text-pink-400",
      badge: summary?.ai?.pending_review || undefined,
      badgeType: summary?.ai?.pending_review ? "warning" : "default",
      comingSoon: flags.ai === "coming_soon",
    });
  }

  return tiles;
}

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/signin");
  }

  const [summary, flags] = await Promise.all([
    getHomeSummary(),
    Promise.resolve(getFeatureFlags()),
  ]);

  const tiles = buildModuleTiles(summary, flags);

  return (
    <div className="min-h-screen-safe bg-slate-950 text-slate-100">
      <HomePageClient />
      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-slate-400 mt-1">Select a module to get started</p>
        </div>
        <Suspense fallback={<TileGridSkeleton />}>
          <TileGrid tiles={tiles} />
        </Suspense>
      </div>
    </div>
  );
}

function TileGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {[...Array(7)].map((_, i) => (
        <div key={i} className="card p-4 h-[88px] animate-pulse">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-slate-800" />
            <div className="flex-1">
              <div className="h-4 bg-slate-800 rounded w-24 mb-2" />
              <div className="h-3 bg-slate-800 rounded w-32" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Icons
function TaskIcon() {
  return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>;
}
function MeetingIcon() {
  return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
}
function LeadsIcon() {
  return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
}
function ScheduleIcon() {
  return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
}
function ClockIcon() {
  return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}
function DocumentIcon() {
  return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
}
function AIIcon() {
  return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
}