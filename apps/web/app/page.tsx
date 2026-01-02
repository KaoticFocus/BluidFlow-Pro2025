import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">B</span>
              </div>
              <span className="text-lg font-semibold">BuildFlow Pro</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/auth/signin" className="btn-ghost">
                Sign In
              </Link>
              <Link href="/auth/signup" className="btn-primary">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-4 py-1.5 text-sm text-cyan-400 ring-1 ring-inset ring-cyan-500/20 mb-8">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
              AI-Powered Construction Management
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              Build Smarter with{" "}
              <span className="gradient-text">AI-First</span> Construction Tools
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
              TaskFlow, MeetingFlow, ScheduleFlow, and more — all with review-first AI assistance, 
              immutable audit trails, and enterprise-grade security.
            </p>

            {/* CTA Buttons */}
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link href="/auth/signup" className="btn-primary text-base px-6 py-3">
                Start Free Trial
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link href="/demo" prefetch={false} className="btn-secondary text-base px-6 py-3">
                Watch Demo
              </Link>
            </div>
          </div>

          {/* Feature Grid */}
          <div className="mt-32 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-w-0">
            {features.map((feature) => {
              // Disable prefetching for public module routes to prevent RSC 404 errors
              const publicModuleRoutes = ['/demo', '/scheduleflow', '/timeclockflow', '/documents'];
              const shouldPrefetch = !publicModuleRoutes.includes(feature.href);
              
              return (
                <Link 
                  key={feature.name} 
                  href={feature.href}
                  prefetch={shouldPrefetch}
                  className="card p-6 group hover:border-slate-700 transition-all hover:shadow-lg hover:shadow-slate-900/50 w-full max-w-full overflow-hidden min-w-0"
                >
                  <div className={`h-10 w-10 rounded-lg ${feature.iconBg} flex items-center justify-center mb-4`}>
                    <feature.icon className={`h-5 w-5 ${feature.iconColor}`} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 group-hover:text-cyan-400 transition-colors">
                    {feature.name}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <p>&copy; 2025 BuildFlow Pro. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="hover:text-slate-400">Privacy</Link>
              <Link href="/terms" className="hover:text-slate-400">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Icons as simple components
function TaskIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
}

function MeetingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function ScheduleIcon({ className }: { className?: string }) {
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

function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function AIIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

const features = [
  {
    name: "TaskFlow",
    description: "Create tasks from voice, photo, or text with AI-powered daily plan generation and punch list management.",
    href: "/taskflow",
    icon: TaskIcon,
    iconBg: "bg-cyan-500/10",
    iconColor: "text-cyan-400",
  },
  {
    name: "MeetingFlow",
    description: "Record meetings, auto-transcribe with Whisper, generate AI summaries with review-first approval.",
    href: "/meetingflow",
    icon: MeetingIcon,
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-400",
  },
  {
    name: "ScheduleFlow",
    description: "Generate baseline schedules, track constraints, and send approval-gated notifications to crews.",
    href: "/scheduleflow",
    icon: ScheduleIcon,
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-400",
  },
  {
    name: "TimeClockFlow",
    description: "Mobile-first timeclock with anomaly detection, reminders, and immutable audit trails.",
    href: "/timeclockflow",
    icon: ClockIcon,
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-400",
  },
  {
    name: "Document Intelligence",
    description: "OCR, classify, and extract structured data from documents with human-in-the-loop review.",
    href: "/documents",
    icon: DocumentIcon,
    iconBg: "bg-rose-500/10",
    iconColor: "text-rose-400",
  },
  {
    name: "AI Action Log",
    description: "Every AI output logged with citations, costs, and review status. Full transparency and auditability.",
    href: "/admin/ai-actions",
    icon: AIIcon,
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-400",
  },
];
