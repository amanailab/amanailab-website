'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import {
  Check, BookOpen, Code2, Layers, HelpCircle, MessageCircle,
  ChevronDown, ChevronRight, Filter, Trophy, RotateCcw,
  CheckSquare, Search, X, Clock, ChevronUp, Zap,
} from 'lucide-react'
import {
  SHEET_TRACKS, getTotalItems, COMPANY_CONFIG, TOPIC_TO_QUIZ,
  type SheetItem, type ItemType, type Difficulty,
} from '@/lib/sheet-data'
import { SHEET_THEORY } from '@/lib/sheet-theory'

// Merge inline theory with the theory map — inline takes priority
function withTheory(item: SheetItem): SheetItem {
  if (item.theory) return item
  const t = SHEET_THEORY[item.id]
  return t ? { ...item, theory: t } : item
}

const STORAGE_KEY = 'ai_sheet_progress_v1'

const DIFF_COLOR: Record<Difficulty, string> = {
  easy:   'text-emerald-400',
  medium: 'text-yellow-400',
  hard:   'text-red-400',
}

const TYPE_COLOR: Record<ItemType, string> = {
  theory:    'text-blue-400',
  code:      'text-green-400',
  project:   'text-orange-400',
  interview: 'text-purple-400',
}

// ─── Resource icon cell ────────────────────────────────────────────────────────
function ResIcon({
  href, title, icon, available, highlight,
}: {
  href?: string
  title: string
  icon: React.ReactNode
  available: boolean
  highlight?: boolean
}) {
  if (!available || !href) {
    return (
      <span title="Not available" className="flex items-center justify-center w-7 h-7 opacity-15 cursor-default">
        {icon}
      </span>
    )
  }
  return (
    <Link
      href={href}
      title={title}
      target={href.startsWith('http') ? '_blank' : undefined}
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

// ─── Row ──────────────────────────────────────────────────────────────────────
function SheetRow({
  item, index, done, onToggle, expanded, onExpand,
}: {
  item: SheetItem
  index: number
  done: boolean
  onToggle: () => void
  expanded: boolean
  onExpand: () => void
}) {
  const quizName = item.quizTopic ?? (item.topic ? TOPIC_TO_QUIZ[item.topic] : undefined)
  const hasExpand = !!(item.theory || item.preview)

  return (
    <>
      {/* Main row */}
      <div
        className={`grid grid-cols-[32px_36px_1fr_auto] sm:grid-cols-[32px_36px_1fr_28px_28px_28px_28px_28px] items-center gap-x-1 px-3 sm:px-4 py-2.5 border-b border-zinc-800/60 transition-colors group ${
          done ? 'bg-emerald-950/20' : 'hover:bg-zinc-800/25'
        }`}
      >
        {/* Checkbox */}
        <button
          onClick={onToggle}
          aria-label={done ? 'Mark incomplete' : 'Mark complete'}
          className={`w-[18px] h-[18px] mx-auto rounded flex items-center justify-center border transition-all ${
            done ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-600 hover:border-zinc-400 bg-transparent'
          }`}
        >
          {done && <Check size={10} strokeWidth={3} className="text-white" />}
        </button>

        {/* Number */}
        <span className="text-[11px] text-zinc-600 text-right font-mono">{index}</span>

        {/* Title + badges */}
        <div className="min-w-0 flex items-center gap-2 flex-wrap">
          <button
            onClick={hasExpand ? onExpand : undefined}
            className={`text-sm font-medium leading-snug text-left transition-colors ${
              done ? 'line-through text-zinc-500' : 'text-zinc-200'
            } ${hasExpand ? 'hover:text-orange-300 cursor-pointer' : ''}`}
          >
            {item.title}
            {item.isNew2026 && (
              <span className="ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 uppercase tracking-wide align-middle">
                2026
              </span>
            )}
          </button>
          {/* Mobile: type + diff inline */}
          <span className={`sm:hidden text-[10px] font-semibold ${TYPE_COLOR[item.type]}`}>
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
          </span>
          <span className={`sm:hidden text-[10px] font-bold ${DIFF_COLOR[item.difficulty]}`}>
            {item.difficulty.charAt(0).toUpperCase() + item.difficulty.slice(1)}
          </span>
          {hasExpand && (
            <button onClick={onExpand} className="sm:hidden text-zinc-600 hover:text-zinc-400 ml-auto">
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}
        </div>

        {/* Desktop resource columns */}
        <ResIcon
          href={
            item.theory
              ? undefined
              : item.hasFlashcard && item.topic
              ? `/flashcards/${item.topic}`
              : undefined
          }
          title={item.theory ? 'Click title to read theory' : item.hasFlashcard && item.topic ? 'Flashcard Revision' : 'No theory'}
          icon={<BookOpen size={13} />}
          available={!!(item.theory || (item.hasFlashcard && item.topic))}
          highlight={false}
        />
        <ResIcon
          href={item.codeSlug ? `/code-lab/${item.codeSlug}` : item.hasCode ? '/code-lab' : undefined}
          title={item.codeSlug ? `Solve: ${item.codeSlug}` : 'Browse Code Lab'}
          icon={<Code2 size={13} />}
          available={!!item.hasCode}
          highlight={!!item.codeSlug}
        />
        <ResIcon
          href={item.hasFlashcard && item.topic ? `/flashcards/${item.topic}` : undefined}
          title="Flashcard Revision"
          icon={<Layers size={13} />}
          available={!!(item.hasFlashcard && item.topic)}
        />
        <ResIcon
          href={item.hasQuiz && quizName ? `/quiz?topic=${encodeURIComponent(quizName)}` : undefined}
          title="Take Quiz"
          icon={<HelpCircle size={13} />}
          available={!!(item.hasQuiz && quizName)}
        />
        <ResIcon
          href={item.hasInterview ? '/interview' : undefined}
          title="Mock Interview"
          icon={<MessageCircle size={13} />}
          available={!!item.hasInterview}
        />
      </div>

      {/* Expand panel */}
      {expanded && hasExpand && (
        <div className="border-b border-zinc-800/60 bg-zinc-900/40">
          {item.theory && (
            <div className="px-4 sm:px-12 py-3 border-b border-zinc-800/40">
              <p className="text-[10px] font-semibold text-orange-400 uppercase tracking-wide mb-1.5">Theory</p>
              <p className="text-sm text-zinc-300 leading-relaxed">{item.theory}</p>
              {item.hasFlashcard && item.topic && (
                <Link href={`/flashcards/${item.topic}`}
                  className="inline-flex items-center gap-1 mt-2 text-[11px] text-zinc-500 hover:text-yellow-400 transition-colors">
                  <Layers size={10} /> Study flashcards →
                </Link>
              )}
            </div>
          )}
          {item.preview && (
            <div className="px-4 sm:px-12 py-3">
              <p className="text-[10px] font-semibold text-blue-400 uppercase tracking-wide mb-1.5">Interview Q&A</p>
              <p className="text-sm text-zinc-200 font-medium leading-snug mb-2">{item.preview.q}</p>
              <p className="text-xs text-zinc-400 leading-relaxed">{item.preview.a}</p>
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
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ [SHEET_TRACKS[0].sections[0].id]: true })
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  const [searchQuery, setSearchQuery]   = useState('')
  const [mounted, setMounted]           = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setProgress(JSON.parse(saved))
    } catch {}
  }, [])

  const save = useCallback((next: Record<string, boolean>) => {
    setProgress(next)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
  }, [])

  const toggleItem    = useCallback((id: string) => save({ ...progress, [id]: !progress[id] }), [progress, save])
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

  // ── Stats ───────────────────────────────────────────────────────────────────
  const totalItems = useMemo(() => getTotalItems(), [])
  const doneItems  = useMemo(
    () => SHEET_TRACKS.reduce((s, t) => s + t.sections.reduce((ss, sec) => ss + sec.items.filter(i => progress[i.id]).length, 0), 0),
    [progress]
  )
  const pct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0

  // ── Active track ────────────────────────────────────────────────────────────
  const track       = SHEET_TRACKS.find(t => t.id === activeTrack)!
  const trackItems  = useMemo(() => track.sections.flatMap(s => s.items), [track])
  const trackDone   = trackItems.filter(i => progress[i.id]).length
  const trackPct    = trackItems.length > 0 ? Math.round(trackDone / trackItems.length * 100) : 0

  // ── Next item ───────────────────────────────────────────────────────────────
  const nextItem = useMemo(() => {
    for (const sec of track.sections) {
      const found = sec.items.find(i => !progress[i.id])
      if (found) return found
    }
    return null
  }, [track, progress])

  // ── Search ──────────────────────────────────────────────────────────────────
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null
    const q = searchQuery.toLowerCase()
    return SHEET_TRACKS.flatMap(t =>
      t.sections.flatMap(sec =>
        sec.items
          .filter(it => it.title.toLowerCase().includes(q) || it.theory?.toLowerCase().includes(q))
          .map(it => ({ item: it, track: t, section: sec }))
      )
    )
  }, [searchQuery])

  // ── Filtered sections ───────────────────────────────────────────────────────
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

  // ── Column header ───────────────────────────────────────────────────────────
  const ColHeader = () => (
    <div className="hidden sm:grid grid-cols-[32px_36px_1fr_28px_28px_28px_28px_28px] gap-x-1 px-4 py-1.5 text-[9px] font-bold uppercase tracking-widest text-zinc-600 border-b border-zinc-800 bg-zinc-950/60">
      <span />
      <span className="text-right">#</span>
      <span>Topic</span>
      <span className="text-center">📖</span>
      <span className="text-center">💻</span>
      <span className="text-center">🎴</span>
      <span className="text-center">❓</span>
      <span className="text-center">🎯</span>
    </div>
  )

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-950 pt-20 pb-20">
      <div className="max-w-5xl mx-auto px-4">

        {/* ── Hero ────────────────────────────────────────────────────── */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold mb-4">
            <Zap size={12} /> 2026 Edition · {totalItems} Topics
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-zinc-100 mb-3 tracking-tight">
            AmanAI Lab Sheet
          </h1>
          <p className="text-zinc-400 max-w-xl mx-auto text-sm sm:text-base">
            Complete this sheet → land your dream AI/ML role. Theory · Code · Projects · Mock Interview.
          </p>
        </div>

        {/* ── Stats row ───────────────────────────────────────────────── */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-5">
          <div className="flex items-center gap-4 mb-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-semibold text-zinc-300">Overall Progress</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-zinc-500">{mounted ? doneItems : 0} / {totalItems}</span>
                  <span className={`text-sm font-extrabold ${pct === 100 ? 'text-emerald-400' : 'text-orange-400'}`}>
                    {mounted ? pct : 0}%
                  </span>
                  <button onClick={() => { if (confirm('Reset all progress?')) save({}) }} title="Reset" className="text-zinc-700 hover:text-zinc-400">
                    <RotateCcw size={12} />
                  </button>
                </div>
              </div>
              <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-700"
                  style={{ width: `${mounted ? pct : 0}%` }}
                />
              </div>
            </div>
          </div>
          {mounted && pct === 100 && (
            <p className="text-center text-emerald-400 text-xs font-semibold">🎉 Sheet Complete — You&apos;re Interview Ready!</p>
          )}

          {/* Track mini-stats */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-3">
            {SHEET_TRACKS.map(t => {
              const items = t.sections.flatMap(s => s.items)
              const done  = items.filter(i => progress[i.id]).length
              const p     = items.length > 0 ? Math.round(done / items.length * 100) : 0
              return (
                <button key={t.id} onClick={() => switchTrack(t.id)}
                  className={`text-center p-2 rounded-xl border transition-all ${
                    activeTrack === t.id ? `${t.bg} ${t.color}` : 'border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
                  }`}>
                  <div className="text-base">{t.icon}</div>
                  <div className="text-[10px] font-bold mt-0.5">{mounted ? p : 0}%</div>
                  <div className="text-[9px] opacity-70 truncate">{t.title.split(' ')[0]}</div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Search ──────────────────────────────────────────────────── */}
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search all 218 topics…"
            className="w-full pl-10 pr-9 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-orange-500/60 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
              <X size={14} />
            </button>
          )}
        </div>

        {/* ── Search results ───────────────────────────────────────────── */}
        {searchResults !== null ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between">
              <span className="text-xs text-zinc-500">{searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for &ldquo;{searchQuery}&rdquo;</span>
            </div>
            {searchResults.length === 0 ? (
              <div className="text-center py-10 text-zinc-600 text-sm">No topics found.</div>
            ) : (
              <>
                <ColHeader />
                {searchResults.map(({ item, track: t, section }, idx) => (
                  <div key={item.id}>
                    {(idx === 0 || searchResults[idx - 1].track.id !== t.id) && (
                      <div className={`px-4 py-1 text-[10px] font-bold uppercase tracking-wider ${t.color} bg-zinc-950/40`}>
                        {t.icon} {t.title} › {section.title}
                      </div>
                    )}
                    <SheetRow
                      item={withTheory(item)} index={idx + 1} done={!!progress[item.id]}
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
            {/* ── Track tabs ──────────────────────────────────────────── */}
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
                    <span className="sm:hidden">{t.title.split(' ')[0]}</span>
                    <span className={`text-[10px] px-1 py-0.5 rounded font-bold ${isActive ? 'bg-black/20' : 'bg-zinc-800 text-zinc-500'}`}>
                      {mounted ? done : 0}/{items.length}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* ── Active track header ─────────────────────────────────── */}
            <div className={`${track.bg} border rounded-2xl px-4 sm:px-5 py-4 mb-4`}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h2 className={`font-extrabold text-lg ${track.color}`}>{track.icon} {track.title}</h2>
                  <p className="text-zinc-400 text-xs mt-0.5 max-w-lg">{track.description}</p>
                </div>
                <div className={`text-right flex-shrink-0 ${track.color}`}>
                  <div className="text-2xl font-extrabold">{mounted ? trackPct : 0}%</div>
                  <div className="text-[10px] text-zinc-500">{mounted ? trackDone : 0}/{trackItems.length}</div>
                </div>
              </div>
              <div className="h-1.5 bg-black/20 rounded-full mt-3 overflow-hidden">
                <div className={`h-full ${track.bar} rounded-full transition-all duration-500`}
                  style={{ width: `${mounted ? trackPct : 0}%` }} />
              </div>
            </div>

            {/* ── Smart next ──────────────────────────────────────────── */}
            {mounted && nextItem && trackDone > 0 && trackDone < trackItems.length && (
              <div className="flex items-center gap-2 px-4 py-2.5 mb-4 bg-zinc-900 border border-orange-500/20 rounded-xl">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0 animate-pulse" />
                <span className="text-xs text-zinc-500 flex-shrink-0">Continue →</span>
                <span className="text-xs font-medium text-zinc-300 truncate">{nextItem.title}</span>
              </div>
            )}

            {/* ── Filters ─────────────────────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-1.5 mb-4">
              <Filter size={11} className="text-zinc-600 mr-0.5" />
              {(['all', 'theory', 'code', 'project', 'interview'] as const).map(t => (
                <button key={t} onClick={() => setFilterType(t)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                    filterType === t ? 'bg-orange-500/10 border-orange-500/40 text-orange-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
                  }`}>
                  {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
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

            {/* ── Legend ──────────────────────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-4 text-[10px] text-zinc-600">
              <span className="font-semibold text-zinc-500">Columns:</span>
              {[
                { icon: '📖', label: 'Theory/Flashcards' },
                { icon: '💻', label: 'Code Lab' },
                { icon: '🎴', label: 'Flashcards' },
                { icon: '❓', label: 'Quiz' },
                { icon: '🎯', label: 'Mock Interview' },
              ].map(({ icon, label }) => (
                <span key={label}>{icon} {label}</span>
              ))}
              <span className="text-green-500">Bright green 💻 = specific problem</span>
              <span className="text-orange-400/70">2026 = new hot topic</span>
            </div>

            {/* ── Sections ────────────────────────────────────────────── */}
            {filteredSections.length === 0 ? (
              <div className="text-center py-14 text-zinc-600">
                No items match. <button onClick={() => { setFilterType('all'); setFilterDiff('all') }} className="text-orange-400 hover:text-orange-300 ml-1">Clear filters</button>
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
                        <button onClick={() => toggleSection(section.id)} className="flex items-center gap-2 flex-1 text-left min-w-0">
                          <span className="text-zinc-500 flex-shrink-0">
                            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </span>
                          <span className="font-bold text-zinc-200 text-sm truncate">{section.title}</span>
                          <span className="text-[10px] text-zinc-600 flex-shrink-0 hidden sm:inline">{section.items.length} topics</span>
                          {section.estimatedTime && (
                            <span className="hidden sm:flex items-center gap-1 text-[10px] text-zinc-600 flex-shrink-0">
                              <Clock size={9} />{section.estimatedTime}
                            </span>
                          )}
                        </button>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {/* Mark all button */}
                          <button onClick={() => markSectionAll(section.items, secDone < section.items.length)}
                            title={secDone < section.items.length ? 'Mark all done' : 'Unmark all'}
                            className="hidden sm:block text-zinc-700 hover:text-zinc-400 transition-colors">
                            <CheckSquare size={13} />
                          </button>
                          {/* Progress */}
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
                              key={item.id} item={withTheory(item)} index={idx + 1}
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

            {/* ── Bottom CTA ───────────────────────────────────────────── */}
            <div className="mt-10 text-center text-zinc-600 text-xs">
              Practice live →{' '}
              <Link href="/code-lab" className="text-orange-400 hover:text-orange-300 font-medium">Code Lab</Link>
              {' · '}
              <Link href="/quiz" className="text-orange-400 hover:text-orange-300 font-medium">Quiz</Link>
              {' · '}
              <Link href="/interview" className="text-orange-400 hover:text-orange-300 font-medium">Mock Interview</Link>
              {' · '}
              <Link href="/flashcards" className="text-orange-400 hover:text-orange-300 font-medium">Flashcards</Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
