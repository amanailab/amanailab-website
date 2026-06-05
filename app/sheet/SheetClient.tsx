'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import Link from 'next/link'
import {
  Check, BookOpen, Code2, Layers, HelpCircle, MessageCircle,
  ChevronDown, ChevronRight, ChevronLeft, Filter, Trophy, RotateCcw,
  CheckSquare, Search, X, Clock, ChevronUp, Sparkles, PenLine,
  Cloud, LogIn,
} from 'lucide-react'
import {
  SHEET_TRACKS, SHEET_PHASES, getTotalItems, TOPIC_TO_QUIZ,
  type SheetItem, type ItemType, type Difficulty,
} from '@/lib/sheet-data'
import { SHEET_THEORY } from '@/lib/sheet-theory'
import { SHEET_TO_DESIGN } from '@/lib/system-design-problems'

const STORAGE_KEY = 'ai_sheet_progress_v1'

const DIFF_COLOR: Record<Difficulty, string> = {
  easy:   'text-emerald-400',
  medium: 'text-yellow-400',
  hard:   'text-red-400',
}

// Merge inline theory with the theory map
function withTheory(item: SheetItem): SheetItem {
  if (item.theory) return item
  const t = SHEET_THEORY[item.id]
  return t ? { ...item, theory: t } : item
}

// ─── Sheet row ──────────────────────────────────────────────────────────────────
function SheetRow({
  item, index, done, onToggle, expanded, onExpand,
}: {
  item: SheetItem; index: number; done: boolean
  onToggle: () => void; expanded: boolean; onExpand: () => void
}) {
  const it = withTheory(item)
  const quizName = it.quizTopic ?? (it.topic ? TOPIC_TO_QUIZ[it.topic] : undefined)
  const designSlug = SHEET_TO_DESIGN[item.id]
  const hasExpand = !!(it.theory || it.preview || designSlug)

  // Only the resources that actually exist for this item — shown as labeled chips.
  const chips = [
    it.theory ? { label: 'Theory', icon: <BookOpen size={12} />, action: onExpand, color: 'text-orange-300 border-orange-500/30 hover:bg-orange-500/10' } : null,
    it.codeSlug ? { label: 'Code', icon: <Code2 size={12} />, href: `/code-lab/${it.codeSlug}`, color: 'text-green-300 border-green-500/30 hover:bg-green-500/10' }
      : it.hasCode ? { label: 'Code Lab', icon: <Code2 size={12} />, href: '/code-lab', color: 'text-green-300 border-green-500/30 hover:bg-green-500/10' } : null,
    (it.hasFlashcard && it.topic) ? { label: 'Flashcards', icon: <Layers size={12} />, href: `/flashcards/${it.topic}`, color: 'text-yellow-300 border-yellow-500/30 hover:bg-yellow-500/10' } : null,
    (it.hasQuiz && quizName) ? { label: 'Quiz', icon: <HelpCircle size={12} />, href: `/quiz?topic=${encodeURIComponent(quizName)}`, color: 'text-violet-300 border-violet-500/30 hover:bg-violet-500/10' } : null,
    it.hasInterview ? { label: 'Mock', icon: <MessageCircle size={12} />, href: '/interview', color: 'text-blue-300 border-blue-500/30 hover:bg-blue-500/10' } : null,
    designSlug ? { label: 'Design', icon: <PenLine size={12} />, href: `/system-design/${designSlug}`, color: 'text-fuchsia-300 border-fuchsia-500/30 hover:bg-fuchsia-500/10' } : null,
  ].filter(Boolean) as { label: string; icon: React.ReactNode; href?: string; action?: () => void; color: string }[]

  return (
    <>
      <div className={`flex items-start gap-3 px-3 sm:px-4 py-3 border-b border-zinc-800/50 transition-colors ${done ? 'bg-emerald-950/20' : 'hover:bg-zinc-900/50'}`}>
        <button onClick={onToggle} aria-label={done ? 'Mark incomplete' : 'Mark complete'}
          className={`mt-0.5 w-5 h-5 rounded-md border flex-shrink-0 flex items-center justify-center transition-all ${
            done ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-600 hover:border-zinc-400'
          }`}>
          {done && <Check size={12} strokeWidth={3} className="text-white" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <button onClick={hasExpand ? onExpand : undefined}
              className={`text-sm font-medium leading-snug text-left transition-colors ${done ? 'line-through text-zinc-500' : 'text-zinc-100'} ${hasExpand ? 'hover:text-orange-300 cursor-pointer' : 'cursor-default'}`}>
              <span className="text-zinc-600 text-xs font-mono mr-2">{index}</span>
              {it.title}
              {it.isNew2026 && (
                <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 uppercase tracking-wide align-middle">2026</span>
              )}
              {designSlug && (
                <span className="inline-flex items-center gap-0.5 ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30 uppercase tracking-wide align-middle">
                  <PenLine size={9} /> Design
                </span>
              )}
            </button>
            <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
              <span className={`text-[11px] font-semibold ${DIFF_COLOR[it.difficulty]}`}>
                {it.difficulty.charAt(0).toUpperCase() + it.difficulty.slice(1)}
              </span>
              {hasExpand && (
                <span className="text-zinc-600">{expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
              )}
            </div>
          </div>

          {chips.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {chips.map(c => c.href ? (
                <Link key={c.label} href={c.href}
                  className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md border bg-zinc-900/60 transition-colors ${c.color}`}>
                  {c.icon} {c.label}
                </Link>
              ) : (
                <button key={c.label} onClick={c.action}
                  className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md border bg-zinc-900/60 transition-colors ${c.color}`}>
                  {c.icon} {c.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Expand panel */}
      {expanded && hasExpand && (
        <div className="border-b border-zinc-800/50 bg-zinc-900/30">
          {it.theory && (
            <div className="px-4 sm:px-12 py-3 border-b border-zinc-800/40">
              <p className="text-[11px] font-bold text-orange-400 uppercase tracking-wider mb-1.5">Theory</p>
              <p className="text-sm text-zinc-300 leading-relaxed">{it.theory}</p>
              <div className="flex items-center gap-4 mt-2">
                {it.hasFlashcard && it.topic && (
                  <Link href={`/flashcards/${it.topic}`} className="text-[11px] text-zinc-500 hover:text-yellow-400 flex items-center gap-1 transition-colors">
                    <Layers size={11} /> Flashcards
                  </Link>
                )}
                {it.hasQuiz && quizName && (
                  <Link href={`/quiz?topic=${encodeURIComponent(quizName)}`} className="text-[11px] text-zinc-500 hover:text-violet-400 flex items-center gap-1 transition-colors">
                    <HelpCircle size={11} /> Take quiz
                  </Link>
                )}
              </div>
            </div>
          )}
          {it.preview && (
            <div className={`px-4 sm:px-12 py-3 ${designSlug ? 'border-b border-zinc-800/40' : ''}`}>
              <p className="text-[11px] font-bold text-blue-400 uppercase tracking-wider mb-1.5">Interview Q&amp;A</p>
              <p className="text-sm text-zinc-200 font-medium leading-snug mb-2">{it.preview.q}</p>
              <p className="text-xs text-zinc-400 leading-relaxed">{it.preview.a}</p>
            </div>
          )}
          {designSlug && (
            <div className="px-4 sm:px-12 py-3">
              <p className="text-[11px] font-bold text-fuchsia-300 uppercase tracking-wider mb-2">Practice Workspace</p>
              <Link
                href={`/system-design/${designSlug}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-300 hover:bg-fuchsia-500/20 hover:text-fuchsia-200 transition-all text-sm font-semibold"
              >
                <PenLine size={14} />
                Open Design Workspace
              </Link>
              <p className="text-[11px] text-zinc-600 mt-1.5">Write your answer, check key areas, get AI review</p>
            </div>
          )}
        </div>
      )}
    </>
  )
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function SheetClient() {
  const [progress, setProgress]         = useState<Record<string, boolean>>({})
  const [activeTrack, setActiveTrack]   = useState(SHEET_TRACKS[0].id)
  const [filterType, setFilterType]     = useState<ItemType | 'all'>('all')
  const [filterDiff, setFilterDiff]     = useState<Difficulty | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'incomplete' | 'new2026'>('all')
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ [SHEET_TRACKS[0].sections[0].id]: true })
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  const [searchQuery, setSearchQuery]   = useState('')
  const [mounted, setMounted]           = useState(false)
  const [isLoggedIn, setIsLoggedIn]     = useState<boolean | null>(null)
  const [synced, setSynced]             = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const syncDebounces = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  // Cleanup all debounce timers on unmount
  useEffect(() => {
    return () => { Object.values(syncDebounces.current).forEach(t => clearTimeout(t)) }
  }, [])

  // Load local progress, then merge with Supabase if logged in
  useEffect(() => {
    setMounted(true)

    // 1 — load localStorage immediately (no flicker)
    let localProgress: Record<string, boolean> = {}
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) localProgress = JSON.parse(saved)
      setProgress(localProgress)
    } catch {}

    // 2 — check auth & fetch Supabase progress
    import('@/lib/supabase/client').then(({ createClient }) => {
      const sb = createClient()
      sb.auth.getUser().then(({ data: { user } }) => {
        if (!user) { setIsLoggedIn(false); return }
        setIsLoggedIn(true)

        fetch('/api/sheet/progress')
          .then(r => r.ok ? r.json() : { items: [] })
          .then(({ items }) => {
            if (!Array.isArray(items)) return

            // Build remote map
            const remote: Record<string, boolean> = {}
            items.forEach(({ item_id }: { item_id: string }) => { remote[item_id] = true })

            // Merge: union of local + remote (remote wins on conflict)
            const merged = { ...localProgress, ...remote }
            setProgress(merged)
            try { localStorage.setItem(STORAGE_KEY, JSON.stringify(merged)) } catch {}
            setSynced(true)

            // Sync any local-only items to Supabase
            const localOnlyIds = Object.keys(localProgress).filter(
              id => localProgress[id] && !remote[id]
            )
            if (localOnlyIds.length > 0) {
              fetch('/api/sheet/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ item_ids: localOnlyIds }),
              }).catch(() => {})
            }
          })
          .catch(() => {})
      })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync a single item to Supabase (debounced per-item, fire-and-forget)
  const syncItemToSupabase = useCallback((id: string, completed: boolean) => {
    if (!isLoggedIn) return
    if (syncDebounces.current[id]) clearTimeout(syncDebounces.current[id])
    syncDebounces.current[id] = setTimeout(() => {
      delete syncDebounces.current[id]
      fetch('/api/sheet/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: id, completed }),
      }).catch(() => {})
    }, 300)
  }, [isLoggedIn])

  const save = useCallback((next: Record<string, boolean>) => {
    setProgress(next)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
  }, [])

  const toggleItem    = useCallback((id: string) => {
    const next = { ...progress, [id]: !progress[id] }
    save(next)
    syncItemToSupabase(id, !!next[id])
  }, [progress, save, syncItemToSupabase])
  const toggleSection = useCallback((id: string) => setOpenSections(p => ({ ...p, [id]: !p[id] })), [])
  const toggleExpand  = useCallback((id: string) => setExpandedItem(p => p === id ? null : id), [])

  const markSectionAll = useCallback((items: SheetItem[], done: boolean) => {
    const next = { ...progress }
    items.forEach(i => { next[i.id] = done })
    save(next)
    if (!isLoggedIn) return
    if (done) {
      // Bulk sync completed items
      fetch('/api/sheet/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_ids: items.map(i => i.id) }),
      }).catch(() => {})
    } else {
      // Mark each item incomplete individually
      items.forEach(i => syncItemToSupabase(i.id, false))
    }
  }, [progress, save, isLoggedIn, syncItemToSupabase])

  const switchTrack = useCallback((id: string) => {
    setActiveTrack(id)
    setFilterType('all')
    setFilterDiff('all')
    setFilterStatus('all')
    setSearchQuery('')
    const t = SHEET_TRACKS.find(t => t.id === id)
    if (t?.sections[0]) setOpenSections({ [t.sections[0].id]: true })
  }, [])

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalItems = useMemo(() => getTotalItems(), [])
  const doneItems  = useMemo(
    () => SHEET_TRACKS.reduce((s, t) => s + t.sections.reduce((ss, sec) => ss + sec.items.filter(i => progress[i.id]).length, 0), 0),
    [progress]
  )
  const pct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0

  // ── Active track ──────────────────────────────────────────────────────────
  const track      = SHEET_TRACKS.find(t => t.id === activeTrack)!
  const trackItems = useMemo(() => track.sections.flatMap(s => s.items), [track])
  const trackDone  = trackItems.filter(i => progress[i.id]).length
  const trackPct   = trackItems.length > 0 ? Math.round(trackDone / trackItems.length * 100) : 0

  // ── Next item ─────────────────────────────────────────────────────────────
  const nextItem = useMemo(() => {
    for (const sec of track.sections) {
      const found = sec.items.find(i => !progress[i.id])
      if (found) return found
    }
    return null
  }, [track, progress])

  // ── Search ────────────────────────────────────────────────────────────────
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null
    const q = searchQuery.toLowerCase()
    return SHEET_TRACKS.flatMap(t =>
      t.sections.flatMap(sec =>
        sec.items
          .filter(it => it.title.toLowerCase().includes(q) || SHEET_THEORY[it.id]?.toLowerCase().includes(q))
          .map(it => ({ item: it, track: t, section: sec }))
      )
    )
  }, [searchQuery])

  // ── Filtered sections ─────────────────────────────────────────────────────
  const filteredSections = useMemo(
    () => track.sections
      .map(sec => ({
        ...sec,
        items: sec.items.filter(it => {
          if (filterType !== 'all' && it.type !== filterType) return false
          if (filterDiff !== 'all' && it.difficulty !== filterDiff) return false
          if (filterStatus === 'incomplete' && progress[it.id]) return false
          if (filterStatus === 'new2026' && !it.isNew2026) return false
          return true
        }),
      }))
      .filter(sec => sec.items.length > 0),
    [track, filterType, filterDiff, filterStatus, progress]
  )

  // ── Difficulty breakdown for active track ─────────────────────────────────
  const trackDiffBreakdown = useMemo(() => {
    const easy = trackItems.filter(i => i.difficulty === 'easy')
    const med = trackItems.filter(i => i.difficulty === 'medium')
    const hard = trackItems.filter(i => i.difficulty === 'hard')
    return {
      easy: { total: easy.length, done: easy.filter(i => progress[i.id]).length },
      medium: { total: med.length, done: med.filter(i => progress[i.id]).length },
      hard: { total: hard.length, done: hard.filter(i => progress[i.id]).length },
    }
  }, [trackItems, progress])

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-950 pt-20 pb-20">
      <div className="max-w-5xl mx-auto px-4">

        {/* ── Hero ──────────────────────────────────────────────────── */}
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold mb-4">
            <Sparkles size={11} /> 2026 Edition
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-zinc-100 mb-3 tracking-tight">
            AI Interview Prep Sheet
          </h1>
          <p className="text-zinc-400 max-w-xl mx-auto text-sm sm:text-base">
            The complete AI/ML roadmap — Generative AI, Agentic AI, Deep Learning, ML, MLOps &amp; System Design.
            Theory · Code · Flashcards · Mock Interviews. All in one place.
          </p>
        </div>

        {/* ── Progress + Roadmap ───────────────────────────────────── */}
        <div className="bg-gradient-to-b from-zinc-900 to-zinc-900/40 border border-zinc-800 rounded-2xl p-5 sm:p-6 mb-6">

          {/* Progress hero: circular ring + stats */}
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="relative flex-shrink-0">
              <svg width="84" height="84" viewBox="0 0 84 84" className="-rotate-90">
                <circle cx="42" cy="42" r="36" fill="none" stroke="#27272a" strokeWidth="8" />
                <circle
                  cx="42" cy="42" r="36" fill="none" strokeWidth="8" strokeLinecap="round"
                  stroke={pct === 100 ? '#34d399' : 'url(#sheetProg)'}
                  strokeDasharray={2 * Math.PI * 36}
                  strokeDashoffset={2 * Math.PI * 36 * (1 - (mounted ? pct : 0) / 100)}
                  className="transition-all duration-700"
                />
                <defs>
                  <linearGradient id="sheetProg" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#fb923c" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-lg font-extrabold ${pct === 100 ? 'text-emerald-400' : 'text-orange-400'}`}>{mounted ? pct : 0}%</span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-base sm:text-lg font-bold text-zinc-100">Your Progress</h2>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {isLoggedIn === true && (
                    <span title={synced ? 'Progress synced to your account' : 'Syncing…'}
                      className={`flex items-center gap-1 text-[10px] transition-colors ${synced ? 'text-emerald-500' : 'text-zinc-600'}`}>
                      <Cloud size={11} />
                      <span className="hidden sm:inline">{synced ? 'Synced' : 'Syncing…'}</span>
                    </span>
                  )}
                  {isLoggedIn === false && (
                    <Link href="/login" title="Sign in to sync progress across devices"
                      className="flex items-center gap-1 text-[10px] text-zinc-600 hover:text-orange-400 transition-colors">
                      <LogIn size={11} />
                      <span className="hidden sm:inline">Sign in to sync</span>
                    </Link>
                  )}
                  {confirmReset ? (
                    <span className="flex items-center gap-1.5 text-[10px]">
                      <span className="text-zinc-400">Reset?</span>
                      <button onClick={() => { save({}); setConfirmReset(false) }} className="font-semibold text-red-400 hover:text-red-300 transition-colors">Yes</button>
                      <button onClick={() => setConfirmReset(false)} className="text-zinc-500 hover:text-zinc-300 transition-colors">No</button>
                    </span>
                  ) : (
                    <button onClick={() => setConfirmReset(true)} title="Reset all progress" aria-label="Reset all progress" className="text-zinc-700 hover:text-zinc-500 transition-colors">
                      <RotateCcw size={12} />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-zinc-400 mt-1">
                <span className="font-bold text-zinc-100">{mounted ? doneItems : 0}</span> of {totalItems} topics done
              </p>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden mt-3">
                <div className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-700" style={{ width: `${mounted ? pct : 0}%` }} />
              </div>
              {mounted && pct === 100 ? (
                <p className="text-emerald-400 text-xs font-semibold mt-2">🎉 Sheet complete — you&apos;re interview ready!</p>
              ) : (
                <p className="text-[11px] text-zinc-500 mt-2">📚 Follow the phases in order — finish all four to be interview-ready.</p>
              )}
            </div>
          </div>

          <div className="h-px bg-zinc-800/80 my-6" />

          {/* Roadmap — vertical timeline: phases → tracks */}
          <div className="relative">
            <div className="absolute left-[11px] top-3 bottom-3 w-px bg-zinc-800" aria-hidden />
            <div className="space-y-6">
              {SHEET_PHASES.map(phase => {
                const phaseTracks = SHEET_TRACKS.filter(t => phase.trackIds.includes(t.id))
                if (phaseTracks.length === 0) return null
                const pItems = phaseTracks.flatMap(t => t.sections.flatMap(s => s.items))
                const pDone  = pItems.filter(i => progress[i.id]).length
                const pComplete = mounted && pItems.length > 0 && pDone === pItems.length
                return (
                  <div key={phase.num} className="relative pl-9">
                    {/* Phase node on the timeline */}
                    <div className={`absolute left-0 top-0 w-[23px] h-[23px] rounded-full border-2 flex items-center justify-center text-[11px] font-extrabold transition-colors ${
                      pComplete ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-zinc-950 border-zinc-700 text-orange-400'
                    }`}>
                      {pComplete ? <Check size={12} strokeWidth={3} /> : phase.num}
                    </div>
                    <div className="flex items-baseline gap-2 mb-2 min-h-[23px]">
                      <span className="text-sm font-bold text-zinc-100">{phase.title}</span>
                      <span className="hidden sm:inline text-[11px] text-zinc-600">{phase.subtitle}</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {phaseTracks.map(t => {
                        const items = t.sections.flatMap(s => s.items)
                        const done  = items.filter(i => progress[i.id]).length
                        const p     = items.length > 0 ? Math.round(done / items.length * 100) : 0
                        const isActive = activeTrack === t.id
                        return (
                          <button key={t.id} onClick={() => switchTrack(t.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left ${
                              isActive ? `${t.bg} border-current/30` : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900'
                            }`}>
                            <span className="text-xl leading-none flex-shrink-0">{t.icon}</span>
                            <span className={`text-sm font-semibold flex-1 min-w-0 truncate ${isActive ? t.color : 'text-zinc-200'}`}>{t.title}</span>
                            <div className="hidden sm:block w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden flex-shrink-0">
                              <div className={`h-full ${t.bar} rounded-full transition-all duration-500`} style={{ width: `${mounted ? p : 0}%` }} />
                            </div>
                            <span className={`text-sm font-bold tabular-nums w-10 text-right flex-shrink-0 ${isActive ? t.color : 'text-zinc-300'}`}>{mounted ? p : 0}%</span>
                            <span className="text-[11px] text-zinc-500 tabular-nums w-12 text-right flex-shrink-0">{mounted ? done : 0}/{items.length}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── Search ────────────────────────────────────────────────── */}
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search any topic across all tracks…"
            className="w-full pl-10 pr-9 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-orange-500/60 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
              <X size={14} />
            </button>
          )}
        </div>

        {/* ── Search results ─────────────────────────────────────────── */}
        {searchResults !== null ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-zinc-800">
              <span className="text-xs text-zinc-500">{searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for &ldquo;{searchQuery}&rdquo;</span>
            </div>
            {searchResults.length === 0 ? (
              <div className="text-center py-10 text-zinc-600 text-sm">No topics found.</div>
            ) : (
              <>
                {searchResults.map(({ item, track: t, section }, idx) => (
                  <div key={item.id}>
                    {(idx === 0 || searchResults[idx - 1].track.id !== t.id || searchResults[idx - 1].section.id !== section.id) && (
                      <div className={`px-4 py-1 text-[10px] font-bold uppercase tracking-wider ${t.color} bg-zinc-950/40`}>
                        {t.icon} {t.title} › {section.title}
                      </div>
                    )}
                    <SheetRow
                      item={item} index={idx + 1} done={!!progress[item.id]}
                      onToggle={() => toggleItem(item.id)}
                      expanded={expandedItem === item.id}
                      onExpand={() => toggleExpand(item.id)}
                    />
                  </div>
                ))}
              </>
            )}
          </div>
        ) : (
          <>
            {/* ── Sticky track nav: current track + prev/next (the sheet is a sequence) ── */}
            {(() => {
              const idx  = SHEET_TRACKS.findIndex(t => t.id === activeTrack)
              const prev = idx > 0 ? SHEET_TRACKS[idx - 1] : null
              const next = idx < SHEET_TRACKS.length - 1 ? SHEET_TRACKS[idx + 1] : null
              return (
                <div className="sticky top-16 z-30 -mx-4 px-4 py-2 bg-zinc-950/85 backdrop-blur-md mb-4 border-b border-zinc-900/60">
                  <div className="flex items-center justify-between gap-2">
                    <button disabled={!prev} onClick={() => prev && switchTrack(prev.id)}
                      className="flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors max-w-[40%] truncate">
                      <ChevronLeft size={14} className="flex-shrink-0" />
                      <span className="truncate">{prev ? `${prev.icon} ${prev.title}` : 'Start'}</span>
                    </button>
                    <span className={`text-xs font-bold whitespace-nowrap ${track.color}`}>
                      {track.icon} <span className="hidden sm:inline">{track.title} · </span>{idx + 1}/{SHEET_TRACKS.length}
                    </span>
                    <button disabled={!next} onClick={() => next && switchTrack(next.id)}
                      className="flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors max-w-[40%] truncate justify-end">
                      <span className="truncate">{next ? `${next.icon} ${next.title}` : 'End'}</span>
                      <ChevronRight size={14} className="flex-shrink-0" />
                    </button>
                  </div>
                </div>
              )
            })()}

            {/* ── Active track header ───────────────────────────────── */}
            <div className={`${track.bg} border rounded-2xl px-4 sm:px-5 py-4 mb-4`}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h2 className={`font-extrabold text-lg ${track.color}`}>{track.icon} {track.title}</h2>
                  <p className="text-zinc-400 text-xs mt-0.5 max-w-lg">{track.description}</p>
                </div>
                <div className={`text-right flex-shrink-0 ${track.color}`}>
                  <div className="text-2xl font-extrabold">{mounted ? trackPct : 0}%</div>
                  <div className="text-[10px] text-zinc-500">{mounted ? trackDone : 0}/{trackItems.length} done</div>
                </div>
              </div>
              <div className="h-1.5 bg-black/20 rounded-full mt-3 overflow-hidden">
                <div className={`h-full ${track.bar} rounded-full transition-all duration-500`}
                  style={{ width: `${mounted ? trackPct : 0}%` }} />
              </div>
              {/* Difficulty breakdown */}
              {mounted && trackItems.length > 0 && (
                <div className="flex items-center gap-3 mt-3 text-[11px]">
                  {trackDiffBreakdown.easy.total > 0 && (
                    <span className="flex items-center gap-1 text-zinc-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="text-emerald-400 font-semibold">{trackDiffBreakdown.easy.done}</span>
                      <span>/{trackDiffBreakdown.easy.total} Easy</span>
                    </span>
                  )}
                  {trackDiffBreakdown.medium.total > 0 && (
                    <span className="flex items-center gap-1 text-zinc-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                      <span className="text-yellow-400 font-semibold">{trackDiffBreakdown.medium.done}</span>
                      <span>/{trackDiffBreakdown.medium.total} Med</span>
                    </span>
                  )}
                  {trackDiffBreakdown.hard.total > 0 && (
                    <span className="flex items-center gap-1 text-zinc-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                      <span className="text-red-400 font-semibold">{trackDiffBreakdown.hard.done}</span>
                      <span>/{trackDiffBreakdown.hard.total} Hard</span>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* ── Next item hint ────────────────────────────────────── */}
            {mounted && nextItem && trackDone > 0 && trackDone < trackItems.length && (
              <div className="flex items-center gap-2 px-4 py-2.5 mb-4 bg-zinc-900 border border-orange-500/20 rounded-xl">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0 animate-pulse" />
                <span className="text-xs text-zinc-500 flex-shrink-0">Continue →</span>
                <span className="text-xs font-medium text-zinc-300 truncate">{nextItem.title}</span>
              </div>
            )}

            {/* ── Filters ──────────────────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-1.5 mb-4">
              <Filter size={11} className="text-zinc-600 mr-0.5" />
              {(['all', 'theory', 'code', 'project', 'interview'] as const).map(t => (
                <button key={t} onClick={() => setFilterType(t)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                    filterType === t ? 'bg-orange-500/10 border-orange-500/40 text-orange-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
                  }`}>
                  {t === 'all' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
              <div className="w-px h-3 bg-zinc-800 mx-0.5" />
              {(['all', 'easy', 'medium', 'hard'] as const).map(d => (
                <button key={d} onClick={() => setFilterDiff(d)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                    filterDiff === d ? 'bg-orange-500/10 border-orange-500/40 text-orange-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
                  }`}>
                  {d === 'all' ? 'All Levels' : d.charAt(0).toUpperCase() + d.slice(1)}
                </button>
              ))}
              <div className="w-px h-3 bg-zinc-800 mx-0.5" />
              <button onClick={() => setFilterStatus(filterStatus === 'incomplete' ? 'all' : 'incomplete')}
                className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                  filterStatus === 'incomplete' ? 'bg-orange-500/10 border-orange-500/40 text-orange-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
                }`}>
                Incomplete only
              </button>
              <button onClick={() => setFilterStatus(filterStatus === 'new2026' ? 'all' : 'new2026')}
                className={`text-xs px-2.5 py-1 rounded-full border transition-all flex items-center gap-1 ${
                  filterStatus === 'new2026' ? 'bg-orange-500/10 border-orange-500/40 text-orange-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
                }`}>
                <Sparkles size={10} /> New 2026
              </button>
            </div>

            {/* ── Sections ──────────────────────────────────────────── */}
            {filteredSections.length === 0 ? (
              <div className="text-center py-14 text-zinc-600 text-sm">
                No items match.{' '}
                <button onClick={() => { setFilterType('all'); setFilterDiff('all'); setFilterStatus('all') }} className="text-orange-400 hover:text-orange-300">Clear filters</button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSections.map(section => {
                  const secDone = section.items.filter(i => progress[i.id]).length
                  const secPct  = section.items.length > 0 ? Math.round(secDone / section.items.length * 100) : 0
                  const isComplete = mounted && secDone === section.items.length && section.items.length > 0
                  const isOpen = openSections[section.id] ?? false

                  return (
                    <div key={section.id}
                      className={`bg-zinc-900 border rounded-2xl overflow-hidden ${isComplete ? 'border-emerald-500/30' : 'border-zinc-800'}`}>
                      {/* Section header */}
                      <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800/60">
                        <button onClick={() => toggleSection(section.id)} className="flex items-center gap-2.5 flex-1 text-left min-w-0">
                          <span className="text-zinc-500 flex-shrink-0">
                            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </span>
                          <span className="font-bold text-zinc-200 text-sm truncate">{section.title}</span>
                          {section.estimatedTime && (
                            <span className="hidden sm:flex items-center gap-1 text-[10px] text-zinc-600 flex-shrink-0">
                              <Clock size={9} />{section.estimatedTime}
                            </span>
                          )}
                        </button>

                        <div className="flex items-center gap-2.5 flex-shrink-0">
                          <button
                            onClick={() => markSectionAll(section.items, secDone < section.items.length)}
                            title={secDone < section.items.length ? 'Mark all done' : 'Unmark all'}
                            className="hidden sm:block text-zinc-700 hover:text-zinc-400 transition-colors"
                          >
                            <CheckSquare size={13} />
                          </button>
                          <div className="hidden sm:flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                              <div className={`h-full ${track.bar} rounded-full transition-all`}
                                style={{ width: `${mounted ? secPct : 0}%` }} />
                            </div>
                            <span className="text-[10px] text-zinc-500 w-9 text-right">
                              {mounted ? secDone : 0}/{section.items.length}
                            </span>
                          </div>
                          {isComplete && (
                            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5">
                              <Trophy size={10} /> Done
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Rows */}
                      {isOpen && (
                        <>
                          {section.items.map((item, idx) => (
                            <SheetRow
                              key={item.id} item={item} index={idx + 1}
                              done={!!progress[item.id]}
                              onToggle={() => toggleItem(item.id)}
                              expanded={expandedItem === item.id}
                              onExpand={() => toggleExpand(item.id)}
                            />
                          ))}
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* ── Bottom links ──────────────────────────────────────── */}
            <div className="mt-10 text-center text-zinc-600 text-xs">
              Practice hands-on →{' '}
              <Link href="/code-lab" className="text-orange-400 hover:text-orange-300 font-medium">Code Lab</Link>{' · '}
              <Link href="/quiz" className="text-orange-400 hover:text-orange-300 font-medium">Quiz</Link>{' · '}
              <Link href="/interview" className="text-orange-400 hover:text-orange-300 font-medium">Mock Interview</Link>{' · '}
              <Link href="/flashcards" className="text-orange-400 hover:text-orange-300 font-medium">Flashcards</Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
