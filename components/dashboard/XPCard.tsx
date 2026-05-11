"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Zap, Code2 } from 'lucide-react'

export const LEVELS = [
  { min: 0,    max: 299,  label: 'ML Beginner',     color: 'text-zinc-400',   bg: 'bg-zinc-500/10 border-zinc-500/20',    bar: 'bg-zinc-500',    emoji: '🌱' },
  { min: 300,  max: 699,  label: 'AI Explorer',     color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20',     bar: 'bg-blue-500',    emoji: '🔭' },
  { min: 700,  max: 1499, label: 'ML Practitioner', color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20',   bar: 'bg-green-500',   emoji: '⚡' },
  { min: 1500, max: 2999, label: 'AI Engineer',     color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20', bar: 'bg-violet-500',  emoji: '🛠️' },
  { min: 3000, max: 4999, label: 'ML Expert',       color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', bar: 'bg-orange-500',  emoji: '🎯' },
  { min: 5000, max: Infinity, label: 'AI Master',   color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', bar: 'bg-yellow-400',  emoji: '👑' },
]

export function getLevel(xp: number) {
  return LEVELS.find(l => xp >= l.min && xp <= l.max) ?? LEVELS[0]
}

export function nextLevel(xp: number) {
  const idx = LEVELS.findIndex(l => xp >= l.min && xp <= l.max)
  return LEVELS[idx + 1] ?? null
}

export default function XPCard() {
  const [xp, setXp]         = useState<number | null>(null)
  const [solved, setSolved] = useState(0)

  useEffect(() => {
    // Try server first, fall back to localStorage
    fetch('/api/code-lab/xp')
      .then(r => r.json())
      .then(d => {
        const serverXp = d.xp ?? 0
        setXp(serverXp)
        try { localStorage.setItem('codelab_xp', String(serverXp)) } catch { /* ignore */ }
      })
      .catch(() => {
        try { setXp(parseInt(localStorage.getItem('codelab_xp') ?? '0')) } catch { setXp(0) }
      })

    fetch('/api/code-lab/progress')
      .then(r => r.json())
      .then(d => setSolved((d.solved ?? []).length))
      .catch(() => {})
  }, [])

  if (xp === null) return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 animate-pulse">
      <div className="h-4 w-24 bg-zinc-800 rounded mb-3" />
      <div className="h-8 w-16 bg-zinc-800 rounded mb-2" />
      <div className="h-1.5 w-full bg-zinc-800 rounded" />
    </div>
  )

  if (xp === 0) return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-zinc-600" />
        <p className="text-sm font-bold text-zinc-400">Code Lab XP</p>
      </div>
      <p className="text-xs text-zinc-600 mb-3 leading-relaxed">
        Solve coding problems to earn XP and unlock levels — from ML Beginner to AI Master.
      </p>
      <Link
        href="/code-lab"
        className="flex items-center justify-center gap-2 w-full bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-400 text-xs font-semibold py-2.5 rounded-xl transition-colors"
      >
        <Code2 className="w-3.5 h-3.5" /> Earn your first XP →
      </Link>
    </div>
  )

  const level    = getLevel(xp)
  const next     = nextLevel(xp)
  const progress = next ? Math.round(((xp - level.min) / (next.min - level.min)) * 100) : 100

  return (
    <div className={`bg-zinc-900 border rounded-2xl p-4 ${level.bg}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap className={`w-4 h-4 ${level.color}`} />
          <p className="text-sm font-bold text-zinc-100">Code Lab XP</p>
        </div>
        <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full border ${level.bg} ${level.color}`}>
          {level.emoji} {level.label}
        </span>
      </div>

      <div className="flex items-baseline gap-1.5 mb-2">
        <span className={`text-3xl font-extrabold tabular-nums ${level.color}`}>{xp.toLocaleString()}</span>
        <span className="text-xs text-zinc-500">XP</span>
        {next && <span className="text-xs text-zinc-600 ml-1">/ {next.min.toLocaleString()} for {next.emoji} {next.label}</span>}
      </div>

      {next && (
        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-3">
          <div className={`h-full rounded-full transition-all duration-700 ${level.bar}`}
            style={{ width: `${progress}%` }} />
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <Code2 className="w-3.5 h-3.5" />
          <span>{solved} problem{solved !== 1 ? 's' : ''} solved</span>
        </div>
        <Link href="/code-lab" className={`text-xs font-semibold ${level.color} hover:underline`}>
          Earn more XP →
        </Link>
      </div>
    </div>
  )
}
