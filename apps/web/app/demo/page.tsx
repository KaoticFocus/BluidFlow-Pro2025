import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Demo - BuildFlow Pro",
  description: "Watch a demo of BuildFlow Pro's key features",
};

// Ensure this page is statically generated
export const dynamic = 'force-static';

export default function DemoPage() {
  return (
    <div className="min-h-screen-safe bg-slate-950 text-slate-100 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Demo</h1>
        <p className="text-slate-400 mb-6">
          Demo content coming soon. This page is a placeholder for the BuildFlow Pro demo.
        </p>
        <div className="card p-6">
          <p className="text-slate-300">
            The demo will showcase key features of BuildFlow Pro including TaskFlow, MeetingFlow, and AI-powered workflows.
          </p>
        </div>
      </div>
    </div>
  );
}

