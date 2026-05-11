'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Lock, CheckCircle2, Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword]     = useState('')
  const [confirm, setConfirm]       = useState('')
  const [showPw, setShowPw]         = useState(false)
  const [loading, setLoading]       = useState(false)
  const [done, setDone]             = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [sessionReady, setSessionReady] = useState(false)

  useEffect(() => {
    // After /auth/callback exchanges the recovery code, session is in cookies.
    // Verify session exists before showing the form.
    createClient().auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true)
      else setError('Reset link has expired or already been used. Please request a new one.')
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setError(null)
    setLoading(true)
    const supabase = createClient()
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (err) { setError(err.message); return }
    setDone(true)
    setTimeout(() => router.push('/dashboard'), 2500)
  }

  if (done) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-7 h-7 text-green-400" />
        </div>
        <h1 className="text-2xl font-extrabold text-zinc-100 mb-2">Password updated!</h1>
        <p className="text-sm text-zinc-400">Redirecting you to your dashboard…</p>
      </div>
    </div>
  )

  if (!sessionReady && !error) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <Loader2 className="w-7 h-7 text-zinc-600 animate-spin" />
    </div>
  )

  if (error && !sessionReady) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <AlertCircle className="w-7 h-7 text-red-400" />
        </div>
        <h1 className="text-xl font-extrabold text-zinc-100 mb-2">Link expired</h1>
        <p className="text-sm text-zinc-400 mb-6">{error}</p>
        <Link href="/forgot-password"
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold px-5 py-3 rounded-xl transition-all">
          Request new link
        </Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <div className="w-12 h-12 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center mb-5">
            <Lock className="w-5 h-5 text-orange-400" />
          </div>
          <h1 className="text-2xl font-extrabold text-zinc-100 mb-1">Set new password</h1>
          <p className="text-sm text-zinc-500">Choose a strong password for your account.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">New Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                required
                autoFocus
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 rounded-xl px-4 py-3 pr-11 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-all"
              />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Confirm Password</label>
            <input
              type={showPw ? 'text' : 'password'}
              required
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repeat your password"
              className={`w-full bg-zinc-900 border focus:ring-1 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-all ${
                confirm && password !== confirm
                  ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
                  : 'border-zinc-800 focus:border-orange-500 focus:ring-orange-500/20'
              }`}
            />
            {confirm && password !== confirm && (
              <p className="text-xs text-red-400">Passwords do not match</p>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2.5 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <span className="shrink-0 mt-0.5">⚠</span> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password || !confirm || password !== confirm}
            className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/25 mt-1"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            Update Password
          </button>
        </form>
      </div>
    </div>
  )
}
