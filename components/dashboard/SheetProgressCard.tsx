'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ListChecks, ArrowRight, CheckCircle2, Cloud } from 'lucide-react'
import { SHEET_TRACKS, getTotalItems } from '@/lib/sheet-data'

const STORAGE_KEY = 'ai_sheet_progress_v1'

export default function SheetProgressCard() {
  const [progress, setProgress] = useState<Record<string, boolean>>({})
  const [mounted, setMounted]   = useState(false)
  const [synced, setSynced]     = useState(false)

  useEffect(() => {
    setMounted(true)

    // Load localStorage first
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setProgress(JSON.parse(saved))
    } catch {}

    // Fetch from Supabase if logged in (more accurate — includes other devices)
    fetch('/api/sheet/progress')
      .then(r => r.json())
      .then(({ items }) => {
        if (!Array.isArray(items) || items.length === 0) return
        const remote: Record<string, boolean> = {}
        items.forEach(({ item_id }: { item_id: string }) => { remote[item_id] = true })
        setProgress(prev => ({ ...prev, ...remote }))
        setSynced(true)
      })
      .catch(() => {})
  }, [])

  const total = getTotalItems()
  const done  = Object.values(progress).filter(Boolean).length
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0

  // Find first incomplete item across all tracks for "next up" suggestion
  let nextItem: { title: string; track: string } | null = null
  for (const track of SHEET_TRACKS) {
    for (const sec of track.sections) {
      const found = sec.items.find(i => !progress[i.id])
      if (found) { nextItem = { title: found.title, track: track.title }; break }
    }
    if (nextItem) break
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
            <ListChecks size={14} className="text-orange-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-zinc-100">Interview Prep Sheet</p>
            {mounted && synced && (
              <p className="text-[10px] text-emerald-500 flex items-center gap-0.5">
                <Cloud size={9} /> Synced
              </p>
            )}
          </div>
        </div>
        <Link href="/sheet" className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-0.5 transition-colors">
          Open <ArrowRight size={12} />
        </Link>
      </div>

      {/* Overall progress */}
      <div className="mb-5">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-zinc-500">{mounted ? done : 0} / {total} topics</span>
          <span className={`font-extrabold ${pct === 100 ? 'text-emerald-400' : 'text-orange-400'}`}>
            {mounted ? pct : 0}%
          </span>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-700"
            style={{ width: `${mounted ? pct : 0}%` }}
          />
        </div>
        {pct === 100 && mounted && (
          <p className="text-[11px] text-emerald-400 font-semibold mt-1.5 flex items-center gap-1">
            <CheckCircle2 size={11} /> Sheet Complete — You&apos;re Interview Ready!
          </p>
        )}
      </div>

      {/* Per-track bars */}
      <div className="space-y-2 mb-4">
        {SHEET_TRACKS.map(track => {
          const items    = track.sections.flatMap(s => s.items)
          const trackDone = items.filter(i => progress[i.id]).length
          const trackPct  = items.length > 0 ? Math.round((trackDone / items.length) * 100) : 0
          return (
            <div key={track.id} className="flex items-center gap-2">
              <span className="text-sm flex-shrink-0 w-5 text-center leading-none">{track.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${track.bar} rounded-full transition-all duration-500`}
                    style={{ width: `${mounted ? trackPct : 0}%` }}
                  />
                </div>
              </div>
              <span className="text-[10px] text-zinc-600 w-10 text-right tabular-nums flex-shrink-0">
                {mounted ? trackDone : 0}/{items.length}
              </span>
            </div>
          )
        })}
      </div>

      {/* Next up */}
      {nextItem && mounted && done > 0 && (
        <div className="border-t border-zinc-800 pt-3">
          <p className="text-[10px] text-zinc-600 mb-1">Continue where you left off</p>
          <Link href="/sheet" className="flex items-start gap-1.5 group">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0 mt-1.5 animate-pulse" />
            <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors leading-snug line-clamp-2">
              {nextItem.title}
            </span>
          </Link>
        </div>
      )}

      {/* Empty state */}
      {done === 0 && mounted && (
        <div className="border-t border-zinc-800 pt-3 text-center">
          <p className="text-xs text-zinc-600 mb-2">Start the sheet to track your progress here</p>
          <Link href="/sheet"
            className="inline-flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 font-medium transition-colors">
            Start now <ArrowRight size={11} />
          </Link>
        </div>
      )}
    </div>
  )
}
