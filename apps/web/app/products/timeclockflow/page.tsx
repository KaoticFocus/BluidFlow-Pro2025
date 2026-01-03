import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TimeClockFlow - Mobile Time Tracking | BuildFlow Pro",
  description: "Mobile-first timeclock with GPS verification, anomaly detection, and immutable audit trails.",
};

export default function TimeClockFlowLandingPage() {
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
              <Link href="/auth/signup" className="px-4 py-2 text-sm font-medium bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg transition-all">
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden py-24">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 via-transparent to-transparent" />
          <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl" />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-1.5 text-sm text-emerald-400 ring-1 ring-inset ring-emerald-500/20 mb-6">
                  <ClockIcon className="w-4 h-4" />
                  TimeClockFlow
                  <span className="px-2 py-0.5 text-xs bg-emerald-500/20 rounded-full">Coming Soon</span>
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                  Time Tracking{" "}
                  <span className="text-emerald-400">Built for the Field</span>
                </h1>
                <p className="text-xl text-slate-400 mb-8">
                  Mobile-first timeclock with GPS verification, AI anomaly detection, and immutable audit trails. Know exactly who's where, when.
                </p>
                <div className="flex items-center gap-4 flex-wrap">
                  <Link href="/auth/signup" className="inline-flex items-center gap-2 px-6 py-3 font-semibold bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl transition-all">
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
                <div className="bg-slate-900 rounded-2xl ring-1 ring-slate-800 p-6 shadow-2xl max-w-sm mx-auto">
                  <div className="text-center mb-6">
                    <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                      <ClockIcon className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h3 className="text-2xl font-bold">08:47:32</h3>
                    <p className="text-sm text-slate-400">Current shift duration</p>
                  </div>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <span className="text-sm text-slate-400">Clock In</span>
                      <span className="text-sm font-medium">7:00 AM</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <span className="text-sm text-slate-400">Location</span>
                      <div className="flex items-center gap-1 text-sm">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                        <span className="font-medium">Site A - Verified</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <span className="text-sm text-slate-400">Break Taken</span>
                      <span className="text-sm font-medium">30 min</span>
                    </div>
                  </div>
                  <button className="w-full py-4 bg-rose-500 hover:bg-rose-400 text-white font-semibold rounded-xl transition-all">
                    Clock Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-24 bg-slate-900/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Time Tracking That Works</h2>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                Built for construction crews who need reliability, not complexity.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, i) => (
                <div key={i} className="bg-slate-900/50 rounded-xl p-6 ring-1 ring-slate-800">
                  <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-emerald-400" />
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
            <h2 className="text-3xl font-bold mb-6">Be First to Try TimeClockFlow</h2>
            <p className="text-lg text-slate-400 mb-8">
              Join the waitlist for early access to mobile-first time tracking.
            </p>
            <Link href="/auth/signup" className="inline-flex items-center gap-2 px-8 py-4 font-semibold bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl transition-all">
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

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function MobileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
}

function GPSIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

function AuditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function OfflineIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
    </svg>
  );
}

function ReportIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

const features = [
  {
    icon: MobileIcon,
    title: "Mobile-First Design",
    description: "Built for workers in the field. Simple one-tap clock in/out from any smartphone.",
  },
  {
    icon: GPSIcon,
    title: "GPS Verification",
    description: "Automatic location verification ensures accurate job site tracking.",
  },
  {
    icon: AlertIcon,
    title: "AI Anomaly Detection",
    description: "Flags unusual patterns like missed punches, overtime spikes, or location mismatches.",
  },
  {
    icon: AuditIcon,
    title: "Immutable Audit Trails",
    description: "Every punch is timestamped and cryptographically signed. Cannot be altered.",
  },
  {
    icon: OfflineIcon,
    title: "Offline Support",
    description: "Works without internet. Syncs automatically when connection is restored.",
  },
  {
    icon: ReportIcon,
    title: "Payroll Integration",
    description: "Export to QuickBooks, ADP, Paychex, and other payroll systems.",
  },
];
