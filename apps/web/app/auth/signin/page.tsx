import { Suspense } from 'react'
import SignInContent from './SignInContent'

// Loading fallback for the signin page
function SignInLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
              <span className="text-slate-900 font-black text-lg">B</span>
            </div>
            <span className="text-2xl font-bold text-white">BuildFlow Pro</span>
          </div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-700 rounded w-1/2"></div>
            <div className="h-4 bg-slate-700 rounded w-3/4"></div>
            <div className="space-y-3 mt-6">
              <div className="h-12 bg-slate-700 rounded-xl"></div>
              <div className="h-12 bg-slate-700 rounded-xl"></div>
              <div className="h-12 bg-amber-500/30 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={<SignInLoading />}>
      <SignInContent />
    </Suspense>
  )
}
