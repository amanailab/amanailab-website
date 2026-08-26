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
    <div className="flex items-start gap-3 p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
      <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center shrink-0">
        <Crown className="w-4 h-4 text-orange-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-orange-200 mb-0.5">Daily limit reached</p>
        <p className="text-xs text-zinc-400 leading-relaxed">
          {message ?? "You've used today's free quota for this tool. Upgrade to the Interview Prep Kit for unlimited access — all tools, every day."}
        </p>
        <Link
          href="/upgrade"
          className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-white text-xs font-bold transition-colors"
        >
          <Zap className="w-3 h-3" />
          View plans — from ₹799
        </Link>
      </div>
      <button onClick={() => setDismissed(true)} className="text-zinc-600 hover:text-zinc-400 mt-0.5 shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
