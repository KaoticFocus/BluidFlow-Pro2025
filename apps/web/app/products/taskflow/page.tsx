import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TaskFlow - AI-Powered Task Management | BuildFlow Pro",
  description: "Create tasks from voice, photo, or text. Get AI-powered daily plans and manage punch lists with ease.",
};

export default function TaskFlowLandingPage() {
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
              <Link href="/auth/signup" className="px-4 py-2 text-sm font-medium bg-cyan-500 hover:bg-cyan-400 text-white rounded-lg transition-all">
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden py-24">
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-transparent to-transparent" />
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl" />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-4 py-1.5 text-sm text-cyan-400 ring-1 ring-inset ring-cyan-500/20 mb-6">
                  <TaskIcon className="w-4 h-4" />
                  TaskFlow
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                  Task Management,{" "}
                  <span className="text-cyan-400">Reimagined</span>
                </h1>
                <p className="text-xl text-slate-400 mb-8">
                  Create tasks from voice, photo, or text. Let AI generate your daily plans and keep your punch lists organized — all with review-first oversight.
                </p>
                <div className="flex items-center gap-4 flex-wrap">
                  <Link href="/auth/signup" className="inline-flex items-center gap-2 px-6 py-3 font-semibold bg-cyan-500 hover:bg-cyan-400 text-white rounded-xl transition-all">
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
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                      <TaskIcon className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Today's Tasks</h3>
                      <p className="text-sm text-slate-400">AI-generated daily plan</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {["Review foundation inspection report", "Coordinate electrical rough-in", "Order drywall materials", "Site walkthrough with PM"].map((task, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                        <div className={`w-5 h-5 rounded-full border-2 ${i < 2 ? 'bg-cyan-500 border-cyan-500' : 'border-slate-600'} flex items-center justify-center`}>
                          {i < 2 && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className={i < 2 ? 'text-slate-500 line-through' : 'text-slate-200'}>{task}</span>
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
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Everything You Need</h2>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                Purpose-built for construction teams who need to move fast without losing track.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, i) => (
                <div key={i} className="bg-slate-900/50 rounded-xl p-6 ring-1 ring-slate-800">
                  <div className="h-12 w-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-cyan-400" />
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
            <h2 className="text-3xl font-bold mb-6">Ready to Streamline Your Tasks?</h2>
            <p className="text-lg text-slate-400 mb-8">
              Join thousands of construction teams using TaskFlow to stay organized.
            </p>
            <Link href="/auth/signup" className="inline-flex items-center gap-2 px-8 py-4 font-semibold bg-cyan-500 hover:bg-cyan-400 text-white rounded-xl transition-all">
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

function TaskIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
}

function VoiceIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
  );
}

function PhotoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
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

function ListIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  );
}

function TeamIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
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

const features = [
  {
    icon: VoiceIcon,
    title: "Voice Task Creation",
    description: "Speak your tasks on the go. Our AI transcribes and structures them automatically.",
  },
  {
    icon: PhotoIcon,
    title: "Photo-to-Task",
    description: "Snap a photo of a punch list or issue. AI extracts tasks with location and priority.",
  },
  {
    icon: AIIcon,
    title: "AI Daily Planning",
    description: "Get an optimized daily task list based on priorities, deadlines, and team availability.",
  },
  {
    icon: ListIcon,
    title: "Punch List Management",
    description: "Track deficiencies from walkthrough to close-out with photo evidence and assignments.",
  },
  {
    icon: TeamIcon,
    title: "Team Collaboration",
    description: "Assign tasks, track progress, and keep everyone aligned in real-time.",
  },
  {
    icon: AuditIcon,
    title: "Audit Trails",
    description: "Every action logged with timestamps, user attribution, and change history.",
  },
];
