import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Action Log - Full Transparency | BuildFlow Pro",
  description: "Every AI output logged with citations, costs, and review status. Full transparency and auditability.",
};

export default function AIActionsLandingPage() {
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
              <Link href="/auth/signup" className="px-4 py-2 text-sm font-medium bg-blue-500 hover:bg-blue-400 text-white rounded-lg transition-all">
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden py-24">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 via-transparent to-transparent" />
          <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl" />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-4 py-1.5 text-sm text-blue-400 ring-1 ring-inset ring-blue-500/20 mb-6">
                  <AIIcon className="w-4 h-4" />
                  AI Action Log
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                  AI You Can{" "}
                  <span className="text-blue-400">Trust</span> and Audit
                </h1>
                <p className="text-xl text-slate-400 mb-8">
                  Every AI action logged with full citations, cost tracking, and approval workflows. Know exactly what AI did, why, and how much it cost.
                </p>
                <div className="flex items-center gap-4 flex-wrap">
                  <Link href="/auth/signup" className="inline-flex items-center gap-2 px-6 py-3 font-semibold bg-blue-500 hover:bg-blue-400 text-white rounded-xl transition-all">
                    Start Free Trial
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                  <Link href="/demo" className="inline-flex items-center gap-2 px-6 py-3 font-medium text-slate-300 hover:text-white transition-colors">
                    Watch Demo
                  </Link>
                </div>
              </div>
              <div className="relative">
                <div className="bg-slate-900 rounded-2xl ring-1 ring-slate-800 p-6 shadow-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold">Recent AI Actions</h3>
                    <span className="text-sm text-slate-400">Today</span>
                  </div>
                  <div className="space-y-4">
                    {actions.map((action, i) => (
                      <div key={i} className="p-4 bg-slate-800/50 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${action.status === 'approved' ? 'bg-emerald-500' : action.status === 'pending' ? 'bg-amber-500' : 'bg-slate-500'}`} />
                            <span className="font-medium text-sm">{action.type}</span>
                          </div>
                          <span className="text-xs text-slate-400">{action.time}</span>
                        </div>
                        <p className="text-sm text-slate-300 mb-2">{action.description}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-400">
                          <span>Cost: {action.cost}</span>
                          <span>•</span>
                          <span className={action.status === 'approved' ? 'text-emerald-400' : action.status === 'pending' ? 'text-amber-400' : 'text-slate-400'}>
                            {action.status === 'approved' ? '✓ Approved' : action.status === 'pending' ? '⏳ Pending Review' : 'Draft'}
                          </span>
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
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Complete AI Transparency</h2>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                Never wonder what AI did or why. Full visibility into every automated action.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, i) => (
                <div key={i} className="bg-slate-900/50 rounded-xl p-6 ring-1 ring-slate-800">
                  <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-blue-400" />
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
            <h2 className="text-3xl font-bold mb-6">Ready for Trustworthy AI?</h2>
            <p className="text-lg text-slate-400 mb-8">
              Join teams who trust AI because they can verify everything it does.
            </p>
            <Link href="/auth/signup" className="inline-flex items-center gap-2 px-8 py-4 font-semibold bg-blue-500 hover:bg-blue-400 text-white rounded-xl transition-all">
              Start Free Trial
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

function AIIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function LogIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  );
}

function CitationIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  );
}

function CostIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ApprovalIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function HistoryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ExportIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

const actions = [
  {
    type: "Meeting Summary",
    description: "Generated summary for Site Coordination Meeting with 3 action items extracted.",
    time: "10:32 AM",
    cost: "$0.04",
    status: "approved",
  },
  {
    type: "Task Classification",
    description: "Classified 12 punch list items from photo upload. Priority levels assigned.",
    time: "9:15 AM",
    cost: "$0.02",
    status: "pending",
  },
  {
    type: "Document Analysis",
    description: "Extracted revision data from Structural_Plans_v3.pdf. Flagged load change.",
    time: "8:45 AM",
    cost: "$0.08",
    status: "approved",
  },
];

const features = [
  {
    icon: LogIcon,
    title: "Complete Action Log",
    description: "Every AI action recorded with timestamp, user, input, output, and confidence scores.",
  },
  {
    icon: CitationIcon,
    title: "Source Citations",
    description: "AI outputs link back to source documents and data. Verify any claim instantly.",
  },
  {
    icon: CostIcon,
    title: "Cost Tracking",
    description: "Real-time visibility into AI usage costs per action, user, and project.",
  },
  {
    icon: ApprovalIcon,
    title: "Approval Workflows",
    description: "Configure which actions need human review before taking effect.",
  },
  {
    icon: HistoryIcon,
    title: "Version History",
    description: "See how AI outputs evolved across revisions. Compare before and after.",
  },
  {
    icon: ExportIcon,
    title: "Audit Exports",
    description: "Export complete audit trails for compliance, legal, or internal review.",
  },
];
