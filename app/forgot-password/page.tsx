'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Mail, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('')
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const supabase = createClient()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://amanailab.com'
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    setSent(true)
  }

  if (sent) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-7 h-7 text-green-400" />
        </div>
        <h1 className="text-2xl font-extrabold text-zinc-100 mb-2">Check your email</h1>
        <p className="text-sm text-zinc-400 leading-relaxed mb-6">
          We sent a password reset link to <span className="text-zinc-200 font-semibold">{email}</span>. Click it to set a new password.
        </p>
        <p className="text-xs text-zinc-600 mb-6">Didn&apos;t receive it? Check your spam folder or try again.</p>
        <div className="flex flex-col gap-2">
          <button onClick={() => setSent(false)} className="text-sm text-orange-400 hover:text-orange-300 font-semibold transition-colors">
            Try a different email
          </button>
          <Link href="/login" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link href="/login" className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 mb-8 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
        </Link>

        <div className="mb-8">
          <div className="w-12 h-12 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center mb-5">
            <Mail className="w-5 h-5 text-orange-400" />
          </div>
          <h1 className="text-2xl font-extrabold text-zinc-100 mb-1">Forgot password?</h1>
          <p className="text-sm text-zinc-500">Enter your email and we&apos;ll send you a reset link.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              autoFocus
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-all"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2.5 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <span className="shrink-0 mt-0.5">⚠</span> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/25"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            Send Reset Link
          </button>
        </form>

        <p className="text-center text-sm text-zinc-600 mt-6">
          Remembered it?{' '}
          <Link href="/login" className="text-orange-400 hover:text-orange-300 font-semibold transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
