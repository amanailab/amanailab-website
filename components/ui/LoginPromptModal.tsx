"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X, Lock, Sparkles, CheckCircle2, Loader2, BrainCircuit, BarChart2, TrendingUp, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  isOpen: boolean
  onClose: () => void
  feature?: string
  returnPath?: string
}

const BENEFITS = [
  { icon: BrainCircuit, text: 'AI resume analyzer, cover letter & mock interviews', color: 'text-violet-400' },
  { icon: Sparkles,     text: 'System design AI review — see exactly what you missed', color: 'text-orange-400' },
  { icon: FileText,     text: 'A-to-Z interview prep sheet with 279 tracked topics', color: 'text-blue-400' },
  { icon: BarChart2,    text: 'Interview Readiness Score — know where you stand', color: 'text-emerald-400' },
  { icon: TrendingUp,   text: 'Daily streaks, progress tracking, all tools saved', color: 'text-yellow-400' },
]

export default function LoginPromptModal({ isOpen, onClose, feature = 'continue', returnPath }: Props) {
  const [googleLoading, setGoogleLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const enc        = returnPath ? encodeURIComponent(returnPath) : ''
  const signupHref = `/signup${enc ? `?next=${enc}` : ''}`
  const loginHref  = `/login${enc  ? `?next=${enc}` : ''}`

  async function handleGoogle() {
    setGoogleLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback${enc ? `?next=${enc}` : ''}`,
      },
    })
    if (error) setGoogleLoading(false)
    // On success browser navigates away — no need to reset
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="login-prompt-title">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      {/* Card */}
      <div className="relative w-full max-w-sm bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden">
        {/* Top accent */}
        <div className="h-1 bg-gradient-to-r from-orange-500 via-orange-400 to-yellow-400" />

        <div className="p-6">
          <button onClick={onClose} aria-label="Close"
            className="absolute top-4 right-4 p-1.5 hover:bg-zinc-800 rounded-lg transition-colors">
            <X className="w-4 h-4 text-zinc-500" />
          </button>

          <div className="w-11 h-11 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center justify-center mb-4">
            <Lock className="w-5 h-5 text-orange-400" />
          </div>

          <h2 id="login-prompt-title" className="text-lg font-bold text-zinc-100 mb-0.5">
            Sign in to {feature}
          </h2>
          <p className="text-xs text-zinc-500 mb-5">
            Free account · Takes 30 seconds · No credit card
          </p>

          {/* Benefits */}
          <div className="flex flex-col gap-2 mb-5">
            {BENEFITS.map(({ icon: Icon, text, color }) => (
              <div key={text} className="flex items-center gap-2.5">
                <Icon className={`w-3.5 h-3.5 ${color} shrink-0`} />
                <span className="text-xs text-zinc-300">{text}</span>
              </div>
            ))}
          </div>

          {/* Google sign-in — primary CTA */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading}
            className="flex items-center justify-center gap-3 w-full bg-zinc-800 hover:bg-zinc-700 disabled:opacity-60 disabled:cursor-not-allowed border border-zinc-600 hover:border-zinc-500 text-zinc-100 text-sm font-semibold px-4 py-3 rounded-xl transition-all mb-3"
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
            ) : (
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Continue with Google
          </button>

          {/* Create account — secondary CTA */}
          <Link
            href={signupHref}
            className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/25 mb-3"
          >
            <CheckCircle2 className="w-4 h-4" /> Create Free Account
          </Link>

          <p className="text-center text-sm text-zinc-500">
            Already have one?{' '}
            <Link href={loginHref} className="text-orange-400 hover:text-orange-300 font-semibold transition-colors">
              Sign in with email
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
