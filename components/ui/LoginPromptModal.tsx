"use client"

import { useEffect } from 'react'
import Link from 'next/link'
import { X, Lock, Code2, BrainCircuit, Trophy, Flame, CheckCircle2, Sparkles } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  feature?: string
  returnPath?: string
}

const BENEFITS = [
  { icon: Code2,        text: 'Run & submit code — track every solution',  color: 'text-orange-400' },
  { icon: BrainCircuit, text: 'AI interview simulator with live scoring',   color: 'text-violet-400' },
  { icon: Trophy,       text: 'Leaderboard rank + readiness score',         color: 'text-yellow-400' },
  { icon: Flame,        text: 'Daily streaks, achievements, study plans',   color: 'text-orange-300' },
  { icon: Sparkles,     text: 'AI code explain, debug, review',             color: 'text-blue-400'   },
]

export default function LoginPromptModal({ isOpen, onClose, feature = 'continue', returnPath }: Props) {
  // Close on Escape for keyboard users.
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="login-prompt-title">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Card */}
      <div className="relative w-full max-w-sm bg-zinc-900 border border-zinc-700/80 rounded-2xl p-6 shadow-2xl shadow-black/60 animate-slide-up">
        <button onClick={onClose} aria-label="Close"
          className="absolute top-4 right-4 p-1.5 hover:bg-zinc-800 rounded-lg transition-colors">
          <X className="w-4 h-4 text-zinc-500" />
        </button>

        <div className="w-12 h-12 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center justify-center mb-4">
          <Lock className="w-5 h-5 text-orange-400" />
        </div>

        <h2 id="login-prompt-title" className="text-lg font-bold text-zinc-100 mb-1">
          Sign in to {feature}
        </h2>
        <p className="text-sm text-zinc-500 mb-5">
          Free account — takes 30 seconds
        </p>

        <div className="flex flex-col gap-2.5 mb-6">
          {BENEFITS.map(({ icon: Icon, text, color }) => (
            <div key={text} className="flex items-center gap-2.5">
              <Icon className={`w-3.5 h-3.5 ${color} shrink-0`} />
              <span className="text-xs text-zinc-300">{text}</span>
            </div>
          ))}
        </div>

        <Link
          href={signupHref}
          className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/25 mb-3"
        >
          <CheckCircle2 className="w-4 h-4" /> Create Free Account
        </Link>

        <p className="text-center text-sm text-zinc-500">
          Already have one?{' '}
          <Link href={loginHref} className="text-orange-400 hover:text-orange-300 font-semibold transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
