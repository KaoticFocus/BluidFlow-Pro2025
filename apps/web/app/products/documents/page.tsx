import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Document Intelligence - AI Document Processing | BuildFlow Pro",
  description: "OCR, classify, and extract structured data from construction documents with AI-powered workflows.",
};

export default function DocumentsLandingPage() {
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
              <Link href="/auth/signup" className="px-4 py-2 text-sm font-medium bg-rose-500 hover:bg-rose-400 text-white rounded-lg transition-all">
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden py-24">
          <div className="absolute inset-0 bg-gradient-to-b from-rose-500/10 via-transparent to-transparent" />
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-rose-500/10 rounded-full blur-3xl" />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-rose-500/10 px-4 py-1.5 text-sm text-rose-400 ring-1 ring-inset ring-rose-500/20 mb-6">
                  <DocumentIcon className="w-4 h-4" />
                  Document Intelligence
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                  Documents That{" "}
                  <span className="text-rose-400">Understand</span> Themselves
                </h1>
                <p className="text-xl text-slate-400 mb-8">
                  Upload plans, specs, contracts, and RFIs. AI extracts key data, classifies documents, and flags items that need attention — with human review built in.
                </p>
                <div className="flex items-center gap-4 flex-wrap">
                  <Link href="/auth/signup" className="inline-flex items-center gap-2 px-6 py-3 font-semibold bg-rose-500 hover:bg-rose-400 text-white rounded-xl transition-all">
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
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                        <DocumentIcon className="w-5 h-5 text-rose-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Structural_Plans_v3.pdf</h3>
                        <p className="text-sm text-slate-400">Uploaded 2 min ago</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-400 rounded-full ring-1 ring-emerald-500/20">
                      Processed
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="p-4 bg-slate-800/50 rounded-lg">
                      <h4 className="text-sm font-medium text-rose-400 mb-2">Extracted Data</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-slate-400">Type:</span>
                          <span className="ml-2 text-slate-200">Structural Plans</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Revision:</span>
                          <span className="ml-2 text-slate-200">v3.0</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Date:</span>
                          <span className="ml-2 text-slate-200">Jan 2, 2026</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Engineer:</span>
                          <span className="ml-2 text-slate-200">Smith & Co.</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-amber-500/10 rounded-lg ring-1 ring-amber-500/20">
                      <h4 className="text-sm font-medium text-amber-400 mb-1">⚠️ Attention Required</h4>
                      <p className="text-sm text-slate-300">Column C-4 load capacity differs from v2. Review with structural engineer.</p>
                    </div>
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
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Intelligent Document Processing</h2>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                Stop manually reviewing every page. Let AI surface what matters.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, i) => (
                <div key={i} className="bg-slate-900/50 rounded-xl p-6 ring-1 ring-slate-800">
                  <div className="h-12 w-12 rounded-xl bg-rose-500/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-rose-400" />
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
            <h2 className="text-3xl font-bold mb-6">Ready to Tame Your Documents?</h2>
            <p className="text-lg text-slate-400 mb-8">
              Join construction teams processing thousands of documents with AI assistance.
            </p>
            <Link href="/auth/signup" className="inline-flex items-center gap-2 px-8 py-4 font-semibold bg-rose-500 hover:bg-rose-400 text-white rounded-xl transition-all">
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

function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function OCRIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h4a1 1 0 010 2H6v3a1 1 0 01-2 0V5zm16 0a1 1 0 00-1-1h-4a1 1 0 000 2h3v3a1 1 0 002 0V5zM4 19a1 1 0 001 1h4a1 1 0 000-2H6v-3a1 1 0 00-2 0v4zm16 0a1 1 0 01-1 1h-4a1 1 0 010-2h3v-3a1 1 0 012 0v4z" />
    </svg>
  );
}

function ClassifyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  );
}

function ExtractIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  );
}

function ReviewIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function VersionIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  );
}

const features = [
  {
    icon: OCRIcon,
    title: "Automatic OCR",
    description: "Extract text from scanned plans, handwritten notes, and photos with high accuracy.",
  },
  {
    icon: ClassifyIcon,
    title: "Smart Classification",
    description: "AI automatically categorizes documents: plans, specs, RFIs, submittals, and more.",
  },
  {
    icon: ExtractIcon,
    title: "Data Extraction",
    description: "Pull out key fields: dates, revision numbers, responsible parties, specifications.",
  },
  {
    icon: ReviewIcon,
    title: "Human Review",
    description: "AI flags uncertainties for human review. You maintain control over final output.",
  },
  {
    icon: SearchIcon,
    title: "Semantic Search",
    description: "Find documents by meaning, not just keywords. 'Show me load calculations for Building A.'",
  },
  {
    icon: VersionIcon,
    title: "Version Comparison",
    description: "Automatically detect changes between document versions and highlight differences.",
  },
];
