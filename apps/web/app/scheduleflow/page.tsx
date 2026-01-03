import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ScheduleFlow - BuildFlow Pro",
  description: "Generate baseline schedules, track constraints, and send approval-gated notifications to crews",
};

interface Plan {
  id: string;
  name: string;
  status: "draft" | "submitted" | "approved";
  startsAt?: string;
  endsAt?: string;
}

async function getSchedulePlans(params: {
  status?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ items: Plan[]; total: number; page: number; pageSize: number } | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set("status", params.status);
    if (params.from) searchParams.set("from", params.from);
    if (params.to) searchParams.set("to", params.to);
    if (params.page) searchParams.set("page", params.page.toString());
    if (params.pageSize) searchParams.set("pageSize", params.pageSize.toString());
    const res = await fetch(`${apiUrl}/schedule/plans?${searchParams}`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function ScheduleFlowPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; from?: string; to?: string; page?: string; pageSize?: string }>;
}) {
  const params = await searchParams;
  const status = params.status;
  const from = params.from;
  const to = params.to;
  const page = params.page ? parseInt(params.page) : 1;
  const pageSize = params.pageSize ? parseInt(params.pageSize) : 20;

  const data = await getSchedulePlans({ status, from, to, page, pageSize });

  const plans: Plan[] = data?.items ?? [
    { id: "plan_1", name: "Q1 2026 Foundation Phase", status: "approved", startsAt: "2026-01-15", endsAt: "2026-03-31" },
    { id: "plan_2", name: "Electrical Rough-In Schedule", status: "submitted", startsAt: "2026-02-01", endsAt: "2026-02-28" },
    { id: "plan_3", name: "HVAC Installation Timeline", status: "draft", startsAt: "2026-03-01" },
  ];

  const filteredPlans = status ? plans.filter((p) => p.status === status) : plans;

  const statusColors: Record<string, string> = {
    draft: "badge-secondary",
    submitted: "badge-warning",
    approved: "badge-success",
  };

  return (
    <div className="min-h-screen-safe bg-slate-950 text-slate-100 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">ScheduleFlow</h1>
            <p className="text-slate-400 mt-1">Generate baseline schedules, track constraints, and send approval-gated notifications.</p>
          </div>
          <Link href="/scheduleflow/new" className="btn-primary min-h-[44px] px-4 inline-flex items-center gap-2">
            <PlusIcon className="h-4 w-4" />
            New Plan
          </Link>
        </div>

        {(status || from || to) && (
          <div className="flex items-center gap-2 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
            <span className="text-sm text-slate-400">Filters:</span>
            {status && <span className={`badge ${statusColors[status] || "badge-secondary"}`}>{status}</span>}
            {from && <span className="badge badge-secondary">From: {from}</span>}
            {to && <span className="badge badge-secondary">To: {to}</span>}
            <Link href="/scheduleflow" className="text-xs text-cyan-400 hover:text-cyan-300 ml-2">Clear filters</Link>
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          <FilterLink href="/scheduleflow" active={!status}>All</FilterLink>
          <FilterLink href="/scheduleflow?status=draft" active={status === "draft"}>Draft</FilterLink>
          <FilterLink href="/scheduleflow?status=submitted" active={status === "submitted"}>Submitted</FilterLink>
          <FilterLink href="/scheduleflow?status=approved" active={status === "approved"}>Approved</FilterLink>
        </div>

        <div className="card overflow-hidden">
          <div className="divide-y divide-slate-800">
            {filteredPlans.length === 0 ? (
              <div className="p-12 text-center">
                <div className="h-16 w-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <CalendarIcon className="h-8 w-8 text-slate-500" />
                </div>
                <h3 className="text-lg font-medium mb-2">No plans found</h3>
                <p className="text-slate-400 mb-6 max-w-sm mx-auto">{status ? `No ${status} plans available.` : "Create your first schedule plan to get started."}</p>
                <Link href="/scheduleflow/new" className="btn-primary">Create Plan</Link>
              </div>
            ) : (
              filteredPlans.map((plan) => (
                <Link key={plan.id} href={`/scheduleflow/${plan.id}`} className="p-4 flex items-center gap-4 hover:bg-slate-800/50 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-500 min-h-[64px]" aria-label={`View plan: ${plan.name}`}>
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <CalendarIcon className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{plan.name}</p>
                    <p className="text-xs text-slate-500">{plan.startsAt ? formatDate(plan.startsAt) : "No start date"}{plan.endsAt ? ` - ${formatDate(plan.endsAt)}` : ""}</p>
                  </div>
                  <span className={`badge shrink-0 ${statusColors[plan.status]}`}>{plan.status}</span>
                  <ChevronRightIcon className="h-4 w-4 text-slate-500 shrink-0" />
                </Link>
              ))
            )}
          </div>
        </div>

        {data && <div className="text-sm text-slate-400 text-center">Showing {filteredPlans.length} of {data.total} plans (Page {data.page})</div>}
      </div>
    </div>
  );
}

function FilterLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} className={`px-4 py-2 text-sm rounded-lg transition-colors min-h-[44px] flex items-center ${active ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700"}`}>{children}</Link>
  );
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return dateStr;
  }
}

function PlusIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
}

function CalendarIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
}

function ChevronRightIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>;
}