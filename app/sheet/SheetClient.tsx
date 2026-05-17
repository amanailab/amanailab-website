'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import {
  Check, BookOpen, Code2, Layers, HelpCircle, MessageCircle,
  ChevronDown, ChevronRight, Filter, Trophy, Target, RotateCcw,
  CheckSquare, Search, X, Clock, ChevronUp,
} from 'lucide-react'
import {
  SHEET_TRACKS, getTotalItems, COMPANY_CONFIG, TOPIC_TO_QUIZ,
  type SheetItem, type ItemType, type Difficulty,
} from '@/lib/sheet-data'

const STORAGE_KEY = 'ai_sheet_progress_v1'

const TYPE_CONFIG: Record<ItemType, { label: string; color: string; dot: string }> = {
  theory:    { label: 'Theory',    color: 'bg-blue-500/15 text-blue-400 border-blue-500/25',      dot: 'bg-blue-400' },
  code:      { label: 'Code',      color: 'bg-green-500/15 text-green-400 border-green-500/25',   dot: 'bg-green-400' },
  project:   { label: 'Project',   color: 'bg-orange-500/15 text-orange-400 border-orange-500/25',dot: 'bg-orange-400' },
  interview: { label: 'Interview', color: 'bg-purple-500/15 text-purple-400 border-purple-500/25',dot: 'bg-purple-400' },
}

const DIFF_CONFIG: Record<Difficulty, { label: string; color: string }> = {
  easy:   { label: 'Easy',   color: 'text-emerald-400' },
  medium: { label: 'Medium', color: 'text-yellow-400' },
  hard:   { label: 'Hard',   color: 'text-red-400' },
}

// ─── Resource links ────────────────────────────────────────────────────────────
function ResourceLinks({ item }: { item: SheetItem }) {
  const quizName = item.quizTopic ?? (item.topic ? TOPIC_TO_QUIZ[item.topic] : undefined)
  return (
    <div className="flex items-center gap-2">
      {item.topic && (
        <Link href={`/topics/${item.topic}`} title="Study Topic" className="text-zinc-600 hover:text-blue-400 transition-colors">
          <BookOpen size={13} />
        </Link>
      )}
      {item.hasFlashcard && item.topic && (
        <Link href={`/flashcards/${item.topic}`} title="Flashcard Revision" className="text-zinc-600 hover:text-yellow-400 transition-colors">
          <Layers size={13} />
        </Link>
      )}
      {item.hasCode && (
        <Link
          href={item.codeSlug ? `/code-lab/${item.codeSlug}` : '/code-lab'}
          title={item.codeSlug ? 'Solve in Code Lab' : 'Browse Code Lab'}
          className={`transition-colors ${item.codeSlug ? 'text-green-500 hover:text-green-300' : 'text-zinc-600 hover:text-green-400'}`}
        >
          <Code2 size={13} />
        </Link>
      )}
      {item.hasQuiz && quizName && (
        <Link href={`/quiz?topic=${encodeURIComponent(quizName)}`} title="Take Quiz" className="text-zinc-600 hover:text-violet-400 transition-colors">
          <HelpCircle size={13} />
        </Link>
      )}
      {item.hasInterview && (
        <Link href="/interview" title="Mock Interview" className="text-zinc-600 hover:text-orange-400 transition-colors">
          <MessageCircle size={13} />
        </Link>
      )}
    </div>
  )
}

// ─── Company badges ────────────────────────────────────────────────────────────
function CompanyBadges({ companies }: { companies?: string[] }) {
  if (!companies?.length) return null
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {companies.slice(0, 4).map(c => {
        const cfg = COMPANY_CONFIG[c]
        if (!cfg) return null
        return (
          <span key={c} title={c} className={`text-[9px] font-bold px-1 py-0.5 rounded border ${cfg.color}`}>
            {cfg.abbr}
          </span>
        )
      })}
      {companies.length > 4 && (
        <span className="text-[9px] text-zinc-600">+{companies.length - 4}</span>
      )}
    </div>
  )
}

// ─── Sheet Row ─────────────────────────────────────────────────────────────────
function SheetRow({
  item, done, onToggle, isExpanded, onExpandToggle,
}: {
  item: SheetItem
  done: boolean
  onToggle: () => void
  isExpanded: boolean
  onExpandToggle: () => void
}) {
  const tc = TYPE_CONFIG[item.type]
  const dc = DIFF_CONFIG[item.difficulty]

  return (
    <div className={`transition-colors ${done ? 'bg-emerald-500/5' : ''}`}>
      {/* Main row */}
      <div className={`flex items-start gap-3 px-4 py-3 ${!done && 'hover:bg-zinc-800/30'}`}>
        {/* Checkbox */}
        <button
          onClick={onToggle}
          aria-label={done ? 'Mark incomplete' : 'Mark complete'}
          className={`mt-0.5 w-[18px] h-[18px] rounded flex items-center justify-center border flex-shrink-0 transition-all ${
            done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-zinc-700 hover:border-zinc-400'
          }`}
        >
          {done && <Check size={10} strokeWidth={3} />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-start justify-between gap-2">
            <button
              onClick={item.preview ? onExpandToggle : undefined}
              className={`text-sm font-medium leading-snug text-left flex-1 ${
                done ? 'line-through text-zinc-500' : 'text-zinc-200'
              } ${item.preview ? 'hover:text-orange-300 cursor-pointer' : ''}`}
            >
              {item.title}
              {item.isNew2026 && (
                <span className="ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 uppercase tracking-wide align-middle">
                  2026
                </span>
              )}
            </button>
            {item.preview && (
              <button onClick={onExpandToggle} className="text-zinc-600 hover:text-zinc-400 flex-shrink-0 mt-0.5">
                {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
            )}
          </div>

          {/* Badges row */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${tc.color}`}>
              <span className={`w-1 h-1 rounded-full ${tc.dot}`} />
              {tc.label}
            </span>
            <span className={`text-[10px] font-bold ${dc.color}`}>{dc.label}</span>
            <ResourceLinks item={item} />
            <CompanyBadges companies={item.companies} />
          </div>
        </div>
      </div>

      {/* Inline Q&A Preview */}
      {isExpanded && item.preview && (
        <div className="mx-4 mb-3 rounded-xl border border-zinc-700/60 bg-zinc-900/60 overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800/60 bg-zinc-950/40">
            <p className="text-xs font-semibold text-orange-400 mb-1">Interview Question</p>
            <p className="text-sm text-zinc-200 leading-relaxed">{item.preview.q}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs font-semibold text-emerald-400 mb-1">Model Answer</p>
            <p className="text-xs text-zinc-300 leading-relaxed">{item.preview.a}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────
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

  const saveProgress = useCallback((next: Record<string, boolean>) => {
    setProgress(next)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
  }, [])

  const toggleItem = useCallback((id: string) => {
    saveProgress({ ...progress, [id]: !progress[id] })
  }, [progress, saveProgress])

  const markSectionAll = useCallback((items: SheetItem[], done: boolean) => {
    const next = { ...progress }
    items.forEach(i => { next[i.id] = done })
    saveProgress(next)
  }, [progress, saveProgress])

  const toggleSection = useCallback((id: string) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }))
  }, [])

  const handleTrackChange = useCallback((trackId: string) => {
    setActiveTrack(trackId)
    setFilterType('all')
    setFilterDiff('all')
    setSearchQuery('')
    const track = SHEET_TRACKS.find(t => t.id === trackId)
    if (track?.sections[0]) setOpenSections({ [track.sections[0].id]: true })
  }, [])

  const resetProgress = useCallback(() => {
    if (confirm('Reset all progress? This cannot be undone.')) saveProgress({})
  }, [saveProgress])

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalItems = useMemo(() => getTotalItems(), [])
  const doneItems  = useMemo(
    () => SHEET_TRACKS.reduce((sum, t) => sum + t.sections.reduce((s, sec) => s + sec.items.filter(i => progress[i.id]).length, 0), 0),
    [progress]
  )
  const overallPct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0

  // ── Active track ──────────────────────────────────────────────────────────
  const activeTrackData = SHEET_TRACKS.find(t => t.id === activeTrack)!
  const trackAllItems   = useMemo(() => activeTrackData.sections.flatMap(s => s.items), [activeTrackData])
  const trackDone       = trackAllItems.filter(i => progress[i.id]).length
  const trackPct        = trackAllItems.length > 0 ? Math.round((trackDone / trackAllItems.length) * 100) : 0

  // ── Next incomplete item (smart highlight) ────────────────────────────────
  const nextItem = useMemo(() => {
    for (const sec of activeTrackData.sections) {
      const found = sec.items.find(i => !progress[i.id])
      if (found) return found
    }
    return null
  }, [activeTrackData, progress])

  // ── Search ────────────────────────────────────────────────────────────────
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null
    const q = searchQuery.toLowerCase()
    return SHEET_TRACKS.flatMap(track =>
      track.sections.flatMap(sec =>
        sec.items
          .filter(it => it.title.toLowerCase().includes(q))
          .map(it => ({ item: it, trackTitle: track.title, trackColor: track.color, sectionTitle: sec.title }))
      )
    )
  }, [searchQuery])

  // ── Filtered sections (when not searching) ────────────────────────────────
  const filteredSections = useMemo(
    () => activeTrackData.sections
      .map(sec => ({
        ...sec,
        items: sec.items.filter(item => {
          if (filterType !== 'all' && item.type !== filterType) return false
          if (filterDiff !== 'all' && item.difficulty !== filterDiff) return false
          return true
        }),
      }))
      .filter(sec => sec.items.length > 0),
    [activeTrackData, filterType, filterDiff]
  )

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-950 pt-20 pb-20">
      <div className="max-w-5xl mx-auto px-4">

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <div className="text-center mb-10">
          <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 mb-4 tracking-wide uppercase">
            2026 Edition
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-zinc-100 mb-3 tracking-tight">
            AmanAI Lab Sheet
          </h1>
          <p className="text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto">
            The most complete AI/ML interview prep sheet. Theory · Code · Projects · Mock Interviews.
            Complete this → land your dream AI job.
          </p>
        </div>

        {/* ── Search ───────────────────────────────────────────────────── */}
        <div className="relative mb-6">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search any topic across all 218 items…"
            className="w-full pl-10 pr-10 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-orange-500 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
              <X size={14} />
            </button>
          )}
        </div>

        {/* ── Search results ───────────────────────────────────────────── */}
        {searchResults !== null ? (
          <div>
            <p className="text-xs text-zinc-500 mb-3">{searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for &ldquo;{searchQuery}&rdquo;</p>
            {searchResults.length === 0 ? (
              <div className="text-center py-12">
                <Target size={32} className="text-zinc-700 mx-auto mb-2" />
                <p className="text-zinc-500 text-sm">No items found. Try a different keyword.</p>
              </div>
            ) : (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800/50">
                {searchResults.map(({ item, trackTitle, trackColor, sectionTitle }) => (
                  <div key={item.id}>
                    <div className="px-4 pt-2 pb-0.5 flex items-center gap-2">
                      <span className={`text-[10px] font-semibold ${trackColor}`}>{trackTitle}</span>
                      <span className="text-zinc-700 text-[10px]">›</span>
                      <span className="text-[10px] text-zinc-600">{sectionTitle}</span>
                    </div>
                    <SheetRow
                      item={item} done={!!progress[item.id]}
                      onToggle={() => toggleItem(item.id)}
                      isExpanded={expandedItem === item.id}
                      onExpandToggle={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* ── Stats ────────────────────────────────────────────────── */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Total Topics', value: totalItems, color: 'text-zinc-100' },
                { label: 'Completed',    value: mounted ? doneItems : 0,    color: 'text-orange-400' },
                { label: 'Progress',     value: `${mounted ? overallPct : 0}%`, color: 'text-emerald-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center">
                  <div className={`text-2xl sm:text-3xl font-extrabold ${color}`}>{value}</div>
                  <div className="text-xs text-zinc-500 mt-0.5">{label}</div>
                </div>
              ))}
            </div>

            {/* ── Overall progress bar ─────────────────────────────────── */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 mb-6">
              <div className="flex items-center justify-between text-sm mb-2.5">
                <span className="text-zinc-400 font-medium">Overall Progress</span>
                <div className="flex items-center gap-3">
                  <span className="text-zinc-500 text-xs">{mounted ? doneItems : 0}/{totalItems}</span>
                  <button onClick={resetProgress} title="Reset progress" className="text-zinc-600 hover:text-zinc-400">
                    <RotateCcw size={12} />
                  </button>
                </div>
              </div>
              <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-700"
                  style={{ width: `${mounted ? overallPct : 0}%` }}
                />
              </div>
              {mounted && overallPct === 100 && (
                <p className="text-emerald-400 text-xs font-semibold mt-2 text-center">🎉 Sheet Complete — You&apos;re Interview Ready!</p>
              )}
            </div>

            {/* ── Track tabs ───────────────────────────────────────────── */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-4 px-4 scrollbar-thin scrollbar-thumb-zinc-800">
              {SHEET_TRACKS.map(track => {
                const tItems = track.sections.flatMap(s => s.items)
                const tDone  = tItems.filter(i => progress[i.id]).length
                const isActive = activeTrack === track.id
                return (
                  <button
                    key={track.id}
                    onClick={() => handleTrackChange(track.id)}
                    className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all border flex-shrink-0 ${
                      isActive
                        ? `${track.bg} ${track.color}`
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    <span>{track.icon}</span>
                    <span className="hidden sm:inline">{track.title}</span>
                    <span className="sm:hidden">{track.title.split(' ')[0]}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-md font-semibold ${isActive ? 'bg-black/20' : 'bg-zinc-800 text-zinc-500'}`}>
                      {mounted ? tDone : 0}/{tItems.length}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* ── Active track header ──────────────────────────────────── */}
            <div className={`border rounded-2xl p-5 mb-4 ${activeTrackData.bg}`}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h2 className={`text-lg font-bold mb-1 ${activeTrackData.color}`}>
                    {activeTrackData.icon} {activeTrackData.title}
                  </h2>
                  <p className="text-zinc-400 text-sm max-w-xl">{activeTrackData.description}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={`text-2xl font-extrabold ${activeTrackData.color}`}>{mounted ? trackPct : 0}%</div>
                  <div className="text-xs text-zinc-500">{mounted ? trackDone : 0}/{trackAllItems.length} done</div>
                </div>
              </div>
              <div className="mt-4 h-1.5 bg-black/20 rounded-full overflow-hidden">
                <div className={`h-full ${activeTrackData.bar} rounded-full transition-all duration-500`}
                  style={{ width: `${mounted ? trackPct : 0}%` }} />
              </div>
            </div>

            {/* ── Smart next item ──────────────────────────────────────── */}
            {mounted && nextItem && trackDone > 0 && trackDone < trackAllItems.length && (
              <div className="flex items-center gap-3 px-4 py-3 bg-zinc-900 border border-orange-500/20 rounded-xl mb-4">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0 animate-pulse" />
                <span className="text-xs text-zinc-400">Continue here →</span>
                <span className="text-xs font-medium text-zinc-200 truncate">{nextItem.title}</span>
              </div>
            )}

            {/* ── Filters ──────────────────────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="flex items-center gap-1 text-xs text-zinc-600 mr-1"><Filter size={11} /> Filter:</span>
              {(['all', 'theory', 'code', 'project', 'interview'] as const).map(t => (
                <button key={t} onClick={() => setFilterType(t)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                    filterType === t ? 'bg-orange-500/10 border-orange-500/40 text-orange-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
                  }`}>
                  {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
              <div className="hidden sm:block w-px h-3.5 bg-zinc-800" />
              {(['all', 'easy', 'medium', 'hard'] as const).map(d => (
                <button key={d} onClick={() => setFilterDiff(d)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                    filterDiff === d ? 'bg-orange-500/10 border-orange-500/40 text-orange-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
                  }`}>
                  {d === 'all' ? 'All Levels' : d.charAt(0).toUpperCase() + d.slice(1)}
                </button>
              ))}
            </div>

            {/* ── Legend ───────────────────────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-5 text-[10px] text-zinc-600">
              <span className="font-medium text-zinc-500 mr-1">Links:</span>
              {[
                { icon: <BookOpen size={11} />, label: 'Topic' },
                { icon: <Layers size={11} />,   label: 'Flashcards' },
                { icon: <Code2 size={11} />,    label: 'Code Lab' },
                { icon: <HelpCircle size={11} />, label: 'Quiz' },
                { icon: <MessageCircle size={11} />, label: 'Interview' },
              ].map(({ icon, label }) => (
                <span key={label} className="flex items-center gap-1">{icon} {label}</span>
              ))}
              <span className="ml-2 text-orange-400/70 font-semibold">2026 = new hot topic</span>
              <span className="text-zinc-600">· Click title with ▾ for Q&A preview</span>
            </div>

            {/* ── Sections ─────────────────────────────────────────────── */}
            {filteredSections.length === 0 ? (
              <div className="text-center py-14">
                <Target size={32} className="text-zinc-700 mx-auto mb-2" />
                <p className="text-zinc-500 text-sm">No items match filters.</p>
                <button onClick={() => { setFilterType('all'); setFilterDiff('all') }}
                  className="text-xs text-orange-400 hover:text-orange-300 mt-2">Clear filters</button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSections.map(section => {
                  const sectionDone = section.items.filter(i => progress[i.id]).length
                  const sectionPct  = section.items.length > 0 ? Math.round((sectionDone / section.items.length) * 100) : 0
                  const isComplete  = mounted && sectionDone === section.items.length && section.items.length > 0
                  const isOpen      = openSections[section.id] ?? false

                  return (
                    <div key={section.id}
                      className={`bg-zinc-900 border rounded-2xl overflow-hidden transition-colors ${isComplete ? 'border-emerald-500/30' : 'border-zinc-800'}`}>
                      {/* Section Header */}
                      <div className="flex items-center justify-between px-4 py-3.5 gap-3">
                        <button onClick={() => toggleSection(section.id)}
                          className="flex items-center gap-2.5 flex-1 text-left min-w-0">
                          <span className="text-zinc-500 flex-shrink-0">
                            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </span>
                          <span className="font-semibold text-zinc-200 text-sm truncate">{section.title}</span>
                          <span className="text-xs text-zinc-600 flex-shrink-0 hidden sm:inline">{section.items.length} topics</span>
                          {section.estimatedTime && (
                            <span className="hidden sm:flex items-center gap-1 text-[10px] text-zinc-600 flex-shrink-0">
                              <Clock size={9} />{section.estimatedTime}
                            </span>
                          )}
                        </button>

                        <div className="flex items-center gap-2.5 flex-shrink-0">
                          <button
                            onClick={() => markSectionAll(section.items, sectionDone < section.items.length)}
                            title={sectionDone < section.items.length ? 'Mark all done' : 'Unmark all'}
                            className="text-zinc-700 hover:text-zinc-400 transition-colors hidden sm:block"
                          >
                            <CheckSquare size={13} />
                          </button>
                          <div className="hidden sm:flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                              <div className={`h-full ${activeTrackData.bar} rounded-full transition-all`}
                                style={{ width: `${mounted ? sectionPct : 0}%` }} />
                            </div>
                            <span className="text-xs text-zinc-500 w-10 text-right">
                              {mounted ? sectionDone : 0}/{section.items.length}
                            </span>
                          </div>
                          {isComplete && (
                            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                              <Trophy size={10} /> Done
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Items */}
                      {isOpen && (
                        <div className="border-t border-zinc-800 divide-y divide-zinc-800/40">
                          {section.items.map(it => (
                            <SheetRow
                              key={it.id} item={it}
                              done={!!progress[it.id]}
                              onToggle={() => toggleItem(it.id)}
                              isExpanded={expandedItem === it.id}
                              onExpandToggle={() => setExpandedItem(expandedItem === it.id ? null : it.id)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* ── Bottom CTA ───────────────────────────────────────────── */}
            <div className="mt-10 text-center">
              <p className="text-zinc-600 text-sm">
                Practice hands-on →{' '}
                <Link href="/code-lab" className="text-orange-400 hover:text-orange-300 font-medium">Code Lab</Link>
                {' · '}
                <Link href="/quiz" className="text-orange-400 hover:text-orange-300 font-medium">Take a Quiz</Link>
                {' · '}
                <Link href="/interview" className="text-orange-400 hover:text-orange-300 font-medium">Mock Interview</Link>
                {' · '}
                <Link href="/flashcards" className="text-orange-400 hover:text-orange-300 font-medium">Flashcards</Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
