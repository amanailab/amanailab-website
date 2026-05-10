"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Zap, Code2 } from 'lucide-react'

const LEVELS = [
  { min: 0,    max: 99,   label: 'ML Beginner',    color: 'text-zinc-400',   bg: 'bg-zinc-500/10 border-zinc-500/20' },
  { min: 100,  max: 299,  label: 'AI Explorer',    color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20' },
  { min: 300,  max: 599,  label: 'ML Practitioner',color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20' },
  { min: 600,  max: 999,  label: 'AI Engineer',    color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
  { min: 1000, max: 1999, label: 'ML Expert',      color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
  { min: 2000, max: Infinity, label: 'AI Master',  color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
]

function getLevel(xp: number) {
  return LEVELS.find(l => xp >= l.min && xp <= l.max) ?? LEVELS[0]
}

function nextLevelXp(xp: number) {
  const l = LEVELS.findIndex(l => xp >= l.min && xp <= l.max)
  return LEVELS[l + 1]?.min ?? null
}

export default function XPCard() {
  const [xp, setXp]             = useState<number | null>(null)
  const [solved, setSolved]     = useState(0)

  useEffect(() => {
    try { setXp(parseInt(localStorage.getItem('codelab_xp') ?? '0')) } catch { setXp(0) }
    fetch('/api/code-lab/progress').then(r => r.json()).then(d => setSolved((d.solved ?? []).length)).catch(() => {})
  }, [])

  if (xp === null || xp === 0) return null // hide until user earns XP

  const level   = getLevel(xp)
  const nextXp  = nextLevelXp(xp)
  const progress = nextXp ? Math.round(((xp - level.min) / (nextXp - level.min)) * 100) : 100

  return (
    <div className={`bg-zinc-900 border rounded-2xl p-4 ${level.bg}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap className={`w-4 h-4 ${level.color}`} />
          <p className="text-sm font-bold text-zinc-100">Code Lab XP</p>
        </div>
        <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full border ${level.bg} ${level.color}`}>
          {level.label}
        </span>
      </div>

      <div className="flex items-baseline gap-1.5 mb-2">
        <span className={`text-3xl font-extrabold tabular-nums ${level.color}`}>{xp.toLocaleString()}</span>
        <span className="text-xs text-zinc-500">XP</span>
        {nextXp && <span className="text-xs text-zinc-600 ml-1">/ {nextXp} to next level</span>}
      </div>

      {nextXp && (
        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-3">
          <div className={`h-full rounded-full transition-all duration-700 ${level.color.replace('text-', 'bg-')}`}
            style={{ width: `${progress}%` }} />
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <Code2 className="w-3.5 h-3.5" />
          <span>{solved} problems solved</span>
        </div>
        <Link href="/code-lab" className={`text-xs font-semibold ${level.color} hover:underline`}>
          Earn more XP →
        </Link>
      </div>
    </div>
  )
}
