import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ScheduleFlow - AI Schedule Generation | BuildFlow Pro",
  description: "Generate baseline schedules, track constraints, and coordinate crew notifications with AI assistance.",
};

export default function ScheduleFlowLandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      {/* Navigation */}
      <nav className="border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
                <span className="text-white font-bold text-base">B</span>
              </div>
              <span className="text-xl font-bold tracking-tight">BuildFlow Pro</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/auth/signin" className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors">
                Sign In
              </Link>
              <Link href="/auth/signup" className="px-4 py-2 text-sm font-medium bg-amber-500 hover:bg-amber-400 text-white rounded-lg transition-all">
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden py-24">
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 via-transparent to-transparent" />
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-3xl" />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-4 py-1.5 text-sm text-amber-400 ring-1 ring-inset ring-amber-500/20 mb-6">
                  <ScheduleIcon className="w-4 h-4" />
                  ScheduleFlow
                  <span className="px-2 py-0.5 text-xs bg-amber-500/20 rounded-full">Coming Soon</span>
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                  Schedules That{" "}
                  <span className="text-amber-400">Adapt</span>
                </h1>
                <p className="text-xl text-slate-400 mb-8">
                  Generate baseline schedules with AI, track constraints in real-time, and keep crews informed with approval-gated notifications.
                </p>
                <div className="flex items-center gap-4 flex-wrap">
                  <Link href="/auth/signup" className="inline-flex items-center gap-2 px-6 py-3 font-semibold bg-amber-500 hover:bg-amber-400 text-white rounded-xl transition-all">
                    Join Waitlist
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                  <Link href="/demo" className="inline-flex items-center gap-2 px-6 py-3 font-medium text-slate-300 hover:text-white transition-colors">
                    Watch Preview
                  </Link>
                </div>
              </div>
              <div className="relative">
                <div className="bg-slate-900 rounded-2xl ring-1 ring-slate-800 p-6 shadow-2xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                      <ScheduleIcon className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Project Timeline</h3>
                      <p className="text-sm text-slate-400">Q1 2026 Office Build</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {phases.map((phase, i) => (
                      <div key={i} className="relative">
                        <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                          <div className={`w-3 h-3 rounded-full ${phase.status === 'complete' ? 'bg-emerald-500' : phase.status === 'active' ? 'bg-amber-500' : 'bg-slate-600'}`} />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm">{phase.name}</span>
                              <span className="text-xs text-slate-400">{phase.duration}</span>
                            </div>
                            <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${phase.status === 'complete' ? 'bg-emerald-500' : phase.status === 'active' ? 'bg-amber-500' : 'bg-slate-600'}`}
                                style={{ width: `${phase.progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-24 bg-slate-900/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Scheduling, Reimagined</h2>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                Stop fighting with Gantt charts. Let AI handle the complexity while you focus on building.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, i) => (
                <div key={i} className="bg-slate-900/50 rounded-xl p-6 ring-1 ring-slate-800">
                  <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-amber-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-slate-400">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-6">Be First to Experience ScheduleFlow</h2>
            <p className="text-lg text-slate-400 mb-8">
              Join the waitlist for early access to AI-powered scheduling.
            </p>
            <Link href="/auth/signup" className="inline-flex items-center gap-2 px-8 py-4 font-semibold bg-amber-500 hover:bg-amber-400 text-white rounded-xl transition-all">
              Join Waitlist
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <p>&copy; 2026 BuildFlow Pro</p>
            <Link href="/" className="hover:text-slate-400">← Back to Home</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ScheduleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function AIIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function ConstraintIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

function NotifyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}

function UpdateIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

function IntegrationIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
    </svg>
  );
}

function ReportIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

const phases = [
  { name: "Foundation", duration: "2 weeks", progress: 100, status: "complete" },
  { name: "Framing", duration: "3 weeks", progress: 100, status: "complete" },
  { name: "Electrical Rough-in", duration: "2 weeks", progress: 60, status: "active" },
  { name: "Plumbing", duration: "2 weeks", progress: 0, status: "pending" },
  { name: "Drywall", duration: "2 weeks", progress: 0, status: "pending" },
];

const features = [
  {
    icon: AIIcon,
    title: "AI Schedule Generation",
    description: "Input your scope and constraints. AI generates an optimized baseline schedule in minutes.",
  },
  {
    icon: ConstraintIcon,
    title: "Constraint Tracking",
    description: "Monitor dependencies, weather, permits, and resource availability in real-time.",
  },
  {
    icon: NotifyIcon,
    title: "Crew Notifications",
    description: "Approval-gated alerts keep crews informed without notification fatigue.",
  },
  {
    icon: UpdateIcon,
    title: "Real-Time Updates",
    description: "Drag to reschedule. AI automatically adjusts downstream tasks and notifies affected parties.",
  },
  {
    icon: IntegrationIcon,
    title: "Tool Integrations",
    description: "Sync with Procore, MS Project, Primavera, and other construction tools.",
  },
  {
    icon: ReportIcon,
    title: "Progress Reports",
    description: "Generate look-ahead schedules and progress reports for stakeholder meetings.",
  },
];
