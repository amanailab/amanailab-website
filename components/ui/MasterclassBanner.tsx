'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X, Zap } from 'lucide-react'

const BANNER_KEY = 'mc_banner_dismissed_v1'

export default function MasterclassBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(BANNER_KEY)) setVisible(true)
  }, [])

  function dismiss() {
    localStorage.setItem(BANNER_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="relative z-[60] bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 text-white">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-center gap-3 text-sm">
        <Zap className="w-3.5 h-3.5 shrink-0 animate-pulse" />
        <p className="font-semibold text-center">
          <span className="font-black">New Live Class:</span>{' '}
          GenAI & Agentic AI Interview Masterclass — 24 sessions · Early Bird{' '}
          <span className="font-black">₹7,999</span>
        </p>
        <Link href="/masterclass"
          className="shrink-0 bg-white/20 hover:bg-white/30 border border-white/30 text-white text-xs font-black px-3 py-1 rounded-full transition-all whitespace-nowrap">
          View Course →
        </Link>
        <button onClick={dismiss} aria-label="Dismiss"
          className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center hover:bg-white/20 rounded-full transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
