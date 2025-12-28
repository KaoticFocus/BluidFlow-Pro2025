'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' })
      return
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' })
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        setMessage({ type: 'error', text: error.message })
      } else {
        setMessage({ type: 'success', text: 'Password updated successfully!' })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'An unexpected error occurred' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-white mb-2">Account Settings</h1>
        <p className="text-slate-400 mb-8">Manage your account preferences and security</p>

        {/* Password Change Section */}
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
          <h2 className="text-lg font-semibold text-white mb-4">Change Password</h2>
          
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {message && (
              <div className={`p-3 rounded-lg text-sm ${
                message.type === 'success' 
                  ? 'bg-emerald-500/10 border border-emerald-500/50 text-emerald-400'
                  : 'bg-red-500/10 border border-red-500/50 text-red-400'
              }`}>
                {message.text}
              </div>
            )}

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-slate-300 mb-1.5">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-1.5">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-900 font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Account Info Section */}
        <div className="mt-6 bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
          <h2 className="text-lg font-semibold text-white mb-4">Account Information</h2>
          <p className="text-sm text-slate-400">
            To update your email or other profile information, please contact support.
          </p>
        </div>

        {/* Danger Zone */}
        <div className="mt-6 bg-red-900/20 rounded-xl p-6 border border-red-500/30">
          <h2 className="text-lg font-semibold text-red-400 mb-2">Danger Zone</h2>
          <p className="text-sm text-slate-400 mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <button
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 rounded-lg text-sm font-medium transition-colors"
            onClick={() => alert('Account deletion would be implemented here')}
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  )
}

