'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Crown, Zap, X } from 'lucide-react'

interface Props {
  message?: string
  compact?: boolean
}

export default function UpgradeBanner({ message, compact }: Props) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-orange-500/10 border border-orange-500/30 rounded-lg text-xs">
        <Crown className="w-3.5 h-3.5 text-orange-400 shrink-0" />
        <span className="text-orange-200 font-medium flex-1">Daily limit reached.</span>
        <Link href="/upgrade" className="text-orange-400 font-bold hover:text-orange-300 whitespace-nowrap">
          Upgrade →
        </Link>
        <button onClick={() => setDismissed(true)} className="text-zinc-600 hover:text-zinc-400 ml-1">
          <X className="w-3 h-3" />
        </button>
      </div>
    )
  }

  return (
    <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center shrink-0">
          <Crown className="w-4 h-4 text-orange-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-orange-200 mb-0.5">Daily limit reached — resets at midnight</p>
          <p className="text-xs text-zinc-400 leading-relaxed">
            {message ?? "You've used today's free quota for this tool."}
          </p>
        </div>
        <button onClick={() => setDismissed(true)} className="text-zinc-600 hover:text-zinc-400 mt-0.5 shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3 bg-zinc-900/60 border border-zinc-800 rounded-lg p-3">
        <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1.5">Interview Prep Kit unlocks</p>
        <div className="flex flex-wrap gap-1.5">
          {['Resume Analyzer', 'Cover Letters', 'LinkedIn Optimizer', 'Mock Interviews', 'Career Tools'].map(t => (
            <span key={t} className="text-[10px] font-semibold text-zinc-300 bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-full">
              {t} · Unlimited
            </span>
          ))}
          <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-full">
            + 15 SD reviews/day
          </span>
        </div>
      </div>

      <Link
        href="/upgrade"
        className="flex items-center justify-center gap-1.5 mt-3 w-full py-2.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-white text-xs font-bold transition-colors shadow-md shadow-orange-500/15"
      >
        <Zap className="w-3.5 h-3.5" />
        Go Unlimited — ₹1499 / 30 days
      </Link>
    </div>
  )
}
