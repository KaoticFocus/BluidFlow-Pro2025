import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TimeClockFlow - BuildFlow Pro",
  description: "Mobile-first timeclock with anomaly detection, reminders, and immutable audit trails",
};

export default function TimeClockFlowPage() {
  return (
    <div className="min-h-screen-safe bg-slate-950 text-slate-100 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">TimeClockFlow</h1>
        <p className="text-slate-400 mb-6">
          Mobile-first timeclock with anomaly detection, reminders, and immutable audit trails.
        </p>
        <div className="card p-6">
          <p className="text-slate-300">
            TimeClockFlow is coming soon. This feature will provide mobile-first time tracking with AI-powered anomaly detection.
          </p>
        </div>
      </div>
    </div>
  );
}

