'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import Link from 'next/link'
import {
  Check, BookOpen, Code2, Layers, HelpCircle, MessageCircle,
  ChevronDown, ChevronRight, Filter, Trophy, RotateCcw,
  CheckSquare, Search, X, Clock, ChevronUp, Sparkles, PenLine,
  Cloud, CloudOff, LogIn,
} from 'lucide-react'
import {
  SHEET_TRACKS, getTotalItems, TOPIC_TO_QUIZ,
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

// ─── Resource icon ─────────────────────────────────────────────────────────────
function ResIcon({
  href, title, icon, available, highlight,
}: {
  href?: string; title: string; icon: React.ReactNode; available: boolean; highlight?: boolean
}) {
  if (!available || !href) {
    return (
      <span title="Not available" className="flex items-center justify-center w-7 h-7 opacity-[0.15] cursor-not-allowed select-none">
        {icon}
      </span>
    )
  }
  return (
    <Link
      href={href}
      title={title}
      className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all hover:scale-110 ${
        highlight
          ? 'text-green-400 hover:text-green-300 bg-green-500/10 hover:bg-green-500/20'
          : 'text-zinc-400 hover:text-orange-300 hover:bg-zinc-700/60'
      }`}
    >
      {icon}
    </Link>
  )
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

  // Compute available resource links for mobile strip
  const mobileLinks = [
    it.theory && { label: 'Theory', icon: <BookOpen size={10} />, action: onExpand, className: 'text-orange-400 hover:text-orange-300' },
    it.codeSlug ? { label: 'Code', icon: <Code2 size={10} />, href: `/code-lab/${it.codeSlug}`, className: 'text-green-400 hover:text-green-300' }
      : it.hasCode ? { label: 'Code Lab', icon: <Code2 size={10} />, href: '/code-lab', className: 'text-zinc-400 hover:text-zinc-200' } : null,
    it.hasFlashcard && it.topic ? { label: 'Flashcards', icon: <Layers size={10} />, href: `/flashcards/${it.topic}`, className: 'text-yellow-400 hover:text-yellow-300' } : null,
    it.hasQuiz && quizName ? { label: 'Quiz', icon: <HelpCircle size={10} />, href: `/quiz?topic=${encodeURIComponent(quizName)}`, className: 'text-violet-400 hover:text-violet-300' } : null,
    it.hasInterview ? { label: 'Interview', icon: <MessageCircle size={10} />, href: '/interview', className: 'text-zinc-400 hover:text-zinc-200' } : null,
    designSlug ? { label: 'Design', icon: <PenLine size={10} />, href: `/system-design/${designSlug}`, className: 'text-violet-400 hover:text-violet-300' } : null,
  ].filter(Boolean) as { label: string; icon: React.ReactNode; href?: string; action?: () => void; className: string }[]

  return (
    <>
      {/* ── Desktop row ── */}
      <div className={`hidden sm:grid grid-cols-[28px_32px_1fr_28px_28px_28px_28px_28px] items-center gap-x-1 px-4 py-2.5 border-b border-zinc-800/50 transition-colors ${
        done ? 'bg-emerald-950/20' : 'hover:bg-zinc-800/20'
      }`}>
        <button onClick={onToggle} aria-label={done ? 'Mark incomplete' : 'Mark complete'}
          className={`w-[18px] h-[18px] mx-auto rounded border transition-all flex items-center justify-center ${
            done ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-600 hover:border-zinc-400 bg-transparent'
          }`}>
          {done && <Check size={10} strokeWidth={3} className="text-white" />}
        </button>

        <span className="text-[10px] text-zinc-700 text-right font-mono">{index}</span>

        <div className="min-w-0">
          <button onClick={hasExpand ? onExpand : undefined}
            className={`text-sm font-medium leading-snug text-left transition-colors ${done ? 'line-through text-zinc-500' : 'text-zinc-200'} ${hasExpand ? 'hover:text-orange-300 cursor-pointer' : ''}`}>
            {it.title}
            {it.isNew2026 && (
              <span className="ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 uppercase tracking-wide align-middle">2026</span>
            )}
            {designSlug && (
              <span className="inline-flex items-center gap-0.5 ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/30 uppercase tracking-wide align-middle">
                <PenLine size={8} /> Design
              </span>
            )}
          </button>
        </div>

        <ResIcon href={it.theory ? undefined : it.hasFlashcard && it.topic ? `/flashcards/${it.topic}` : undefined}
          title={it.theory ? 'Click title to read theory' : 'Flashcard Revision'}
          icon={<BookOpen size={13} />} available={!!(it.theory || (it.hasFlashcard && it.topic))} />
        <ResIcon href={it.codeSlug ? `/code-lab/${it.codeSlug}` : it.hasCode ? '/code-lab' : undefined}
          title={it.codeSlug ? `Solve: ${it.codeSlug}` : 'Browse Code Lab'}
          icon={<Code2 size={13} />} available={!!it.hasCode} highlight={!!it.codeSlug} />
        <ResIcon href={it.hasFlashcard && it.topic ? `/flashcards/${it.topic}` : undefined}
          title="Flashcard Revision" icon={<Layers size={13} />} available={!!(it.hasFlashcard && it.topic)} />
        <ResIcon href={it.hasQuiz && quizName ? `/quiz?topic=${encodeURIComponent(quizName)}` : undefined}
          title="Take Quiz" icon={<HelpCircle size={13} />} available={!!(it.hasQuiz && quizName)} />
        <ResIcon href={it.hasInterview ? '/interview' : undefined}
          title="Mock Interview" icon={<MessageCircle size={13} />} available={!!it.hasInterview} />
      </div>

      {/* ── Mobile row ── */}
      <div className={`sm:hidden flex items-start gap-3 px-3 py-3 border-b border-zinc-800/50 transition-colors ${done ? 'bg-emerald-950/20' : ''}`}>
        <button onClick={onToggle}
          className={`mt-0.5 w-[18px] h-[18px] rounded border flex-shrink-0 flex items-center justify-center transition-all ${
            done ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-600 hover:border-zinc-400'
          }`}>
          {done && <Check size={10} strokeWidth={3} className="text-white" />}
        </button>

        <div className="flex-1 min-w-0">
          {/* Title + expand toggle */}
          <div className="flex items-start gap-2">
            <button onClick={hasExpand ? onExpand : undefined}
              className={`text-sm font-medium leading-snug text-left flex-1 min-w-0 transition-colors ${done ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
              {it.title}
              {it.isNew2026 && (
                <span className="ml-1 text-[9px] font-bold px-1 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 uppercase tracking-wide align-middle">2026</span>
              )}
            </button>
            <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
              <span className={`text-[10px] font-bold ${DIFF_COLOR[it.difficulty]}`}>
                {it.difficulty.charAt(0).toUpperCase() + it.difficulty.slice(1)}
              </span>
              {hasExpand && (
                <button onClick={onExpand} className="text-zinc-600 hover:text-zinc-400 transition-colors">
                  {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
              )}
            </div>
          </div>

          {/* Mobile resource strip — only available links */}
          {mobileLinks.length > 0 && (
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {mobileLinks.map(link => (
                link.href ? (
                  <Link key={link.label} href={link.href}
                    className={`flex items-center gap-1 text-[11px] font-medium transition-colors ${link.className}`}>
                    {link.icon} {link.label}
                  </Link>
                ) : (
                  <button key={link.label} onClick={link.action}
                    className={`flex items-center gap-1 text-[11px] font-medium transition-colors ${link.className}`}>
                    {link.icon} {link.label}
                  </button>
                )
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Expand panel */}
      {expanded && hasExpand && (
        <div className="border-b border-zinc-800/50 bg-zinc-900/30">
          {it.theory && (
            <div className="px-4 sm:px-[76px] py-3 border-b border-zinc-800/40">
              <p className="text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-1.5">Theory</p>
              <p className="text-sm text-zinc-300 leading-relaxed">{it.theory}</p>
              <div className="flex items-center gap-4 mt-2">
                {it.hasFlashcard && it.topic && (
                  <Link href={`/flashcards/${it.topic}`} className="text-[11px] text-zinc-500 hover:text-yellow-400 flex items-center gap-1 transition-colors">
                    <Layers size={10} /> Flashcards
                  </Link>
                )}
                {it.hasQuiz && quizName && (
                  <Link href={`/quiz?topic=${encodeURIComponent(quizName)}`} className="text-[11px] text-zinc-500 hover:text-violet-400 flex items-center gap-1 transition-colors">
                    <HelpCircle size={10} /> Take quiz
                  </Link>
                )}
              </div>
            </div>
          )}
          {it.preview && (
            <div className={`px-4 sm:px-[76px] py-3 ${designSlug ? 'border-b border-zinc-800/40' : ''}`}>
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1.5">Interview Q&A</p>
              <p className="text-sm text-zinc-200 font-medium leading-snug mb-2">{it.preview.q}</p>
              <p className="text-xs text-zinc-400 leading-relaxed">{it.preview.a}</p>
            </div>
          )}
          {designSlug && (
            <div className="px-4 sm:px-[76px] py-3">
              <p className="text-[10px] font-bold text-violet-400 uppercase tracking-wider mb-2">Practice Workspace</p>
              <Link
                href={`/system-design/${designSlug}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500/10 border border-violet-500/30 text-violet-300 hover:bg-violet-500/20 hover:text-violet-200 transition-all text-sm font-semibold"
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

// ─── Column header ─────────────────────────────────────────────────────────────
function ColHeader() {
  return (
    <div className="hidden sm:grid grid-cols-[28px_32px_1fr_28px_28px_28px_28px_28px] gap-x-1 px-4 py-2 border-b border-zinc-800 bg-zinc-950/60">
      <span />
      <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 text-right self-center">#</span>
      <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 self-center">Topic</span>
      {[
        { icon: <BookOpen size={11} />, label: 'Theory' },
        { icon: <Code2 size={11} />, label: 'Code Lab' },
        { icon: <Layers size={11} />, label: 'Flashcards' },
        { icon: <HelpCircle size={11} />, label: 'Quiz' },
        { icon: <MessageCircle size={11} />, label: 'Interview' },
      ].map(({ icon, label }) => (
        <span key={label} title={label} className="flex justify-center items-center text-zinc-700">
          {icon}
        </span>
      ))}
    </div>
  )
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function SheetClient() {
  const [progress, setProgress]         = useState<Record<string, boolean>>({})
  const [activeTrack, setActiveTrack]   = useState(SHEET_TRACKS[0].id)
  const [filterType, setFilterType]     = useState<ItemType | 'all'>('all')
  const [filterDiff, setFilterDiff]     = useState<Difficulty | 'all'>('all')
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ [SHEET_TRACKS[0].sections[0].id]: true })
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  const [searchQuery, setSearchQuery]   = useState('')
  const [mounted, setMounted]           = useState(false)
  const [isLoggedIn, setIsLoggedIn]     = useState<boolean | null>(null)
  const [synced, setSynced]             = useState(false)
  const syncDebounce                    = useRef<ReturnType<typeof setTimeout> | null>(null)

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
          .then(r => r.json())
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
  }, [])

  // Sync a single item to Supabase (debounced, fire-and-forget)
  const syncItemToSupabase = useCallback((id: string, completed: boolean) => {
    if (!isLoggedIn) return
    if (syncDebounce.current) clearTimeout(syncDebounce.current)
    syncDebounce.current = setTimeout(() => {
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
  }, [progress, save])

  const switchTrack = useCallback((id: string) => {
    setActiveTrack(id)
    setFilterType('all')
    setFilterDiff('all')
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
          return true
        }),
      }))
      .filter(sec => sec.items.length > 0),
    [track, filterType, filterDiff]
  )

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-950 pt-20 pb-20">
      <div className="max-w-5xl mx-auto px-4">

        {/* ── Hero ──────────────────────────────────────────────────── */}
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold mb-4">
            <Sparkles size={11} /> 2026 Edition
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-zinc-100 mb-3 tracking-tight">
            AI Interview Prep Sheet
          </h1>
          <p className="text-zinc-400 max-w-xl mx-auto text-sm sm:text-base">
            The complete AI/ML roadmap — Generative AI, Agentic AI, Deep Learning, ML, MLOps &amp; System Design.
            Theory · Code · Flashcards · Mock Interviews. All in one place.
          </p>
        </div>

        {/* ── Progress ──────────────────────────────────────────────── */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-5">
          <div className="flex items-center justify-between mb-2.5">
            <div>
              <span className="text-sm font-semibold text-zinc-300">Your Progress</span>
              {mounted && doneItems > 0 && (
                <span className="ml-2 text-xs text-zinc-500">— Keep going, you got this!</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-lg font-extrabold ${pct === 100 ? 'text-emerald-400' : 'text-orange-400'}`}>
                {mounted ? pct : 0}%
              </span>
              {/* Sync status indicator */}
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
              <button
                onClick={() => { if (confirm('Reset all progress?')) save({}) }}
                title="Reset all progress"
                className="text-zinc-700 hover:text-zinc-500 transition-colors"
              >
                <RotateCcw size={12} />
              </button>
            </div>
          </div>
          <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-700"
              style={{ width: `${mounted ? pct : 0}%` }}
            />
          </div>
          {mounted && pct === 100 && (
            <p className="text-emerald-400 text-xs font-semibold text-center mb-3">🎉 Sheet Complete — You&apos;re Interview Ready!</p>
          )}

          {/* Per-track grid */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {SHEET_TRACKS.map(t => {
              const items = t.sections.flatMap(s => s.items)
              const done  = items.filter(i => progress[i.id]).length
              const p     = items.length > 0 ? Math.round(done / items.length * 100) : 0
              return (
                <button key={t.id} onClick={() => switchTrack(t.id)}
                  className={`text-center p-2 rounded-xl border transition-all ${
                    activeTrack === t.id ? `${t.bg} ${t.color}` : 'border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300 bg-zinc-900/50'
                  }`}>
                  <div className="text-lg leading-none">{t.icon}</div>
                  <div className="text-[11px] font-bold mt-1">{mounted ? p : 0}%</div>
                  <div className="text-[9px] opacity-70 truncate mt-0.5">{t.title.split(' ').slice(0, 2).join(' ')}</div>
                </button>
              )
            })}
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
                <ColHeader />
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
            {/* ── Track tabs ────────────────────────────────────────── */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4 -mx-4 px-4 scrollbar-thin scrollbar-thumb-zinc-800">
              {SHEET_TRACKS.map(t => {
                const items = t.sections.flatMap(s => s.items)
                const done  = items.filter(i => progress[i.id]).length
                const isActive = activeTrack === t.id
                return (
                  <button key={t.id} onClick={() => switchTrack(t.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border flex-shrink-0 ${
                      isActive ? `${t.bg} ${t.color}` : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    }`}>
                    <span>{t.icon}</span>
                    <span className="hidden sm:inline">{t.title}</span>
                    <span className="sm:hidden">{t.title.split(' ').slice(0, 2).join(' ')}</span>
                    <span className={`text-[10px] px-1 py-0.5 rounded font-bold ${isActive ? 'bg-black/20' : 'bg-zinc-800 text-zinc-500'}`}>
                      {mounted ? done : 0}/{items.length}
                    </span>
                  </button>
                )
              })}
            </div>

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
            </div>

            {/* ── Legend ───────────────────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-5 text-[10px] text-zinc-600">
              <span className="font-semibold text-zinc-500">Icons:</span>
              {[
                { icon: '📖', label: 'Theory / Flashcards' },
                { icon: '💻', label: 'Code Lab' },
                { icon: '🎴', label: 'Flashcards' },
                { icon: '❓', label: 'Quiz' },
                { icon: '🎯', label: 'Mock Interview' },
              ].map(({ icon, label }) => (
                <span key={label}>{icon} {label}</span>
              ))}
              <span className="text-green-400">Bright 💻 = opens specific problem</span>
              <span className="opacity-30">Dim = not available</span>
            </div>

            {/* ── Sections ──────────────────────────────────────────── */}
            {filteredSections.length === 0 ? (
              <div className="text-center py-14 text-zinc-600 text-sm">
                No items match.{' '}
                <button onClick={() => { setFilterType('all'); setFilterDiff('all') }} className="text-orange-400 hover:text-orange-300">Clear filters</button>
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
                          <ColHeader />
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
