import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ScheduleFlow - BuildFlow Pro",
  description: "Generate baseline schedules, track constraints, and send approval-gated notifications to crews",
};

export default function ScheduleFlowPage() {
  return (
    <div className="min-h-screen-safe bg-slate-950 text-slate-100 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">ScheduleFlow</h1>
        <p className="text-slate-400 mb-6">
          Generate baseline schedules, track constraints, and send approval-gated notifications to crews.
        </p>
        <div className="card p-6">
          <p className="text-slate-300">
            ScheduleFlow is coming soon. This feature will allow you to create and manage project schedules with AI assistance.
          </p>
        </div>
      </div>
    </div>
  );
}

