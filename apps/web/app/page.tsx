import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BuildFlow Pro - AI-Powered Construction Management",
  description: "TaskFlow, MeetingFlow, ScheduleFlow, and more — all with review-first AI assistance, immutable audit trails, and enterprise-grade security.",
};

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      {/* Navigation */}
      <nav className="border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
                <span className="text-white font-bold text-base">B</span>
              </div>
              <span className="text-xl font-bold tracking-tight">BuildFlow Pro</span>
            </div>
            <div className="hidden md:flex items-center gap-1">
              <Link href="/products/taskflow" className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800/50">
                TaskFlow
              </Link>
              <Link href="/products/meetingflow" className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800/50">
                MeetingFlow
              </Link>
              <Link href="/products/scheduleflow" className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800/50">
                ScheduleFlow
              </Link>
              <Link href="/products/timeclockflow" className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800/50">
                TimeClockFlow
              </Link>
              <Link href="/products/documents" className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800/50">
                Documents
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/auth/signin" className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors">
                Sign In
              </Link>
              <Link href="/auth/signup" className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-lg transition-all shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40">
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-transparent" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-cyan-500/10 via-blue-500/5 to-transparent rounded-full blur-3xl" />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
            <div className="text-center max-w-4xl mx-auto">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500/10 to-blue-500/10 px-5 py-2 text-sm text-cyan-400 ring-1 ring-inset ring-cyan-500/20 mb-8 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
                </span>
                AI-Powered Construction Management
              </div>

              {/* Headline */}
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-8 leading-[1.1]">
                Build Smarter with{" "}
                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                  AI-First
                </span>
                <br />
                Construction Tools
              </h1>

              {/* Subheadline */}
              <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                From task management to meeting transcription, scheduling to time tracking — 
                all with review-first AI assistance and enterprise-grade security.
              </p>

              {/* CTA Buttons */}
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <Link href="/auth/signup" className="group inline-flex items-center gap-2 px-8 py-4 text-base font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl transition-all shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-105">
                  Start Free Trial
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <Link href="/demo" prefetch={false} className="inline-flex items-center gap-2 px-8 py-4 text-base font-medium text-slate-300 bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-all ring-1 ring-slate-700/50 hover:ring-slate-600">
                  <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Watch Demo
                </Link>
              </div>

              {/* Trust badges */}
              <div className="mt-16 flex items-center justify-center gap-8 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  SOC 2 Compliant
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  End-to-End Encryption
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Audit Trails
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Modules Section */}
        <section className="py-24 bg-slate-900/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                One Platform, Every Tool You Need
              </h2>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                Purpose-built modules for construction teams, powered by AI with human oversight.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {modules.map((module) => (
                <Link
                  key={module.id}
                  href={module.href}
                  prefetch={false}
                  className="group relative bg-slate-900/50 rounded-2xl p-8 ring-1 ring-slate-800 hover:ring-slate-700 transition-all hover:bg-slate-900/80 overflow-hidden"
                >
                  {/* Gradient overlay on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${module.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  
                  <div className="relative">
                    <div className={`h-14 w-14 rounded-2xl ${module.iconBg} flex items-center justify-center mb-6 ring-1 ${module.iconRing}`}>
                      <module.icon className={`h-7 w-7 ${module.iconColor}`} />
                    </div>
                    
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-semibold group-hover:text-white transition-colors">
                        {module.name}
                      </h3>
                      {module.badge && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${module.badgeClass}`}>
                          {module.badge}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-slate-400 mb-6 leading-relaxed">
                      {module.description}
                    </p>
                    
                    <ul className="space-y-2 mb-6">
                      {module.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                          <svg className={`w-4 h-4 ${module.iconColor} shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                    
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-400 group-hover:text-white transition-colors">
                      Learn more
                      <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">
                    {stat.value}
                  </div>
                  <div className="text-slate-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/5 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-t from-cyan-500/10 to-transparent rounded-full blur-3xl" />
          
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Ready to Transform Your Construction Workflow?
            </h2>
            <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto">
              Join thousands of construction teams using BuildFlow Pro to save time, reduce errors, and build better.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link href="/auth/signup" className="group inline-flex items-center gap-2 px-8 py-4 text-base font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl transition-all shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40">
                Start Free Trial
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link href="/demo" prefetch={false} className="inline-flex items-center gap-2 px-8 py-4 text-base font-medium text-slate-300 hover:text-white transition-colors">
                Schedule a Demo
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-violet-600 flex items-center justify-center">
                  <span className="text-white font-bold text-base">B</span>
                </div>
                <span className="text-xl font-bold">BuildFlow Pro</span>
              </div>
              <p className="text-slate-400 text-sm max-w-xs">
                AI-powered construction management platform with review-first AI assistance.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm">Products</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/products/taskflow" className="hover:text-white transition-colors">TaskFlow</Link></li>
                <li><Link href="/products/meetingflow" className="hover:text-white transition-colors">MeetingFlow</Link></li>
                <li><Link href="/products/scheduleflow" className="hover:text-white transition-colors">ScheduleFlow</Link></li>
                <li><Link href="/products/timeclockflow" className="hover:text-white transition-colors">TimeClockFlow</Link></li>
                <li><Link href="/products/documents" className="hover:text-white transition-colors">Documents</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm">Company</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/careers" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms</Link></li>
                <li><Link href="/security" className="hover:text-white transition-colors">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-slate-800/50 flex items-center justify-between text-sm text-slate-500">
            <p>&copy; 2026 BuildFlow Pro. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a href="https://twitter.com" className="hover:text-slate-400 transition-colors" aria-label="Twitter">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg>
              </a>
              <a href="https://linkedin.com" className="hover:text-slate-400 transition-colors" aria-label="LinkedIn">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Icons
function TaskIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
}

function MeetingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function ScheduleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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

const modules = [
  {
    id: "taskflow",
    name: "TaskFlow",
    description: "Create tasks from voice, photo, or text with AI-powered daily plan generation.",
    href: "/products/taskflow",
    icon: TaskIcon,
    iconBg: "bg-cyan-500/10",
    iconColor: "text-cyan-400",
    iconRing: "ring-cyan-500/20",
    gradient: "from-cyan-500/5 to-transparent",
    features: ["Voice & photo task creation", "AI daily planning", "Punch list management"],
    badge: null,
    badgeClass: "",
  },
  {
    id: "meetingflow",
    name: "MeetingFlow",
    description: "Record meetings, auto-transcribe, and generate AI summaries with review-first approval.",
    href: "/products/meetingflow",
    icon: MeetingIcon,
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-400",
    iconRing: "ring-violet-500/20",
    gradient: "from-violet-500/5 to-transparent",
    features: ["Whisper transcription", "AI meeting summaries", "Action item extraction"],
    badge: null,
    badgeClass: "",
  },
  {
    id: "scheduleflow",
    name: "ScheduleFlow",
    description: "Generate baseline schedules, track constraints, and coordinate crew notifications.",
    href: "/products/scheduleflow",
    icon: ScheduleIcon,
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-400",
    iconRing: "ring-amber-500/20",
    gradient: "from-amber-500/5 to-transparent",
    features: ["AI schedule generation", "Constraint tracking", "Crew notifications"],
    badge: "Coming Soon",
    badgeClass: "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20",
  },
  {
    id: "timeclockflow",
    name: "TimeClockFlow",
    description: "Mobile-first timeclock with anomaly detection and immutable audit trails.",
    href: "/products/timeclockflow",
    icon: ClockIcon,
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-400",
    iconRing: "ring-emerald-500/20",
    gradient: "from-emerald-500/5 to-transparent",
    features: ["GPS verification", "Anomaly detection", "Audit trails"],
    badge: "Coming Soon",
    badgeClass: "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20",
  },
  {
    id: "documents",
    name: "Document Intelligence",
    description: "OCR, classify, and extract structured data from construction documents.",
    href: "/products/documents",
    icon: DocumentIcon,
    iconBg: "bg-rose-500/10",
    iconColor: "text-rose-400",
    iconRing: "ring-rose-500/20",
    gradient: "from-rose-500/5 to-transparent",
    features: ["Automatic OCR", "Document classification", "Data extraction"],
    badge: null,
    badgeClass: "",
  },
  {
    id: "ai-actions",
    name: "AI Action Log",
    description: "Every AI output logged with citations, costs, and review status for full transparency.",
    href: "/products/ai-actions",
    icon: AIIcon,
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-400",
    iconRing: "ring-blue-500/20",
    gradient: "from-blue-500/5 to-transparent",
    features: ["Full audit trail", "Cost tracking", "Citation links"],
    badge: null,
    badgeClass: "",
  },
];

const stats = [
  { value: "10k+", label: "Active Users" },
  { value: "500+", label: "Companies" },
  { value: "2M+", label: "Tasks Completed" },
  { value: "99.9%", label: "Uptime" },
];
