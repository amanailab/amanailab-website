'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import {
  Check,
  BookOpen,
  Code2,
  Layers,
  HelpCircle,
  MessageCircle,
  ChevronDown,
  ChevronRight,
  Filter,
  Trophy,
  Target,
  RotateCcw,
  CheckSquare,
} from 'lucide-react'
import { SHEET_TRACKS, getTotalItems, type SheetItem, type ItemType, type Difficulty } from '@/lib/sheet-data'

const STORAGE_KEY = 'ai_sheet_progress_v1'

const TYPE_CONFIG: Record<ItemType, { label: string; color: string; dot: string }> = {
  theory:    { label: 'Theory',    color: 'bg-blue-500/15 text-blue-400 border-blue-500/25',     dot: 'bg-blue-400' },
  code:      { label: 'Code',      color: 'bg-green-500/15 text-green-400 border-green-500/25',  dot: 'bg-green-400' },
  project:   { label: 'Project',   color: 'bg-orange-500/15 text-orange-400 border-orange-500/25', dot: 'bg-orange-400' },
  interview: { label: 'Interview', color: 'bg-purple-500/15 text-purple-400 border-purple-500/25', dot: 'bg-purple-400' },
}

const DIFF_CONFIG: Record<Difficulty, { label: string; color: string }> = {
  easy:   { label: 'Easy',   color: 'text-emerald-400' },
  medium: { label: 'Medium', color: 'text-yellow-400' },
  hard:   { label: 'Hard',   color: 'text-red-400' },
}

// ─── Row ─────────────────────────────────────────────────────────────────────

function SheetRow({
  item,
  done,
  onToggle,
}: {
  item: SheetItem
  done: boolean
  onToggle: () => void
}) {
  const tc = TYPE_CONFIG[item.type]
  const dc = DIFF_CONFIG[item.difficulty]

  return (
    <div
      className={`flex flex-col sm:grid sm:grid-cols-[28px_1fr_auto_auto_auto] sm:gap-x-4 gap-y-1 px-4 py-3 transition-colors ${
        done ? 'bg-emerald-500/5' : 'hover:bg-zinc-800/40'
      }`}
    >
      {/* Checkbox */}
      <button
        onClick={onToggle}
        aria-label={done ? 'Mark as incomplete' : 'Mark as complete'}
        className={`w-5 h-5 mt-0.5 rounded flex items-center justify-center border flex-shrink-0 transition-all ${
          done
            ? 'bg-emerald-500 border-emerald-500 text-white'
            : 'border-zinc-700 hover:border-zinc-400 bg-transparent'
        }`}
      >
        {done && <Check size={11} strokeWidth={3} />}
      </button>

      {/* Title + mobile badges */}
      <div className="flex flex-col gap-1.5 min-w-0">
        <span className={`text-sm font-medium leading-snug ${done ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
          {item.title}
        </span>
        {/* Mobile-only badges row */}
        <div className="flex items-center gap-2 sm:hidden flex-wrap">
          <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${tc.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${tc.dot}`} />
            {tc.label}
          </span>
          <span className={`text-[11px] font-semibold ${dc.color}`}>{dc.label}</span>
          <ResourceLinks item={item} />
        </div>
      </div>

      {/* Desktop: Type Badge */}
      <span className={`hidden sm:inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border whitespace-nowrap self-center ${tc.color}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${tc.dot}`} />
        {tc.label}
      </span>

      {/* Desktop: Difficulty */}
      <span className={`hidden sm:inline text-xs font-semibold self-center whitespace-nowrap ${dc.color}`}>
        {dc.label}
      </span>

      {/* Desktop: Resource Links */}
      <div className="hidden sm:flex items-center gap-2.5 self-center">
        <ResourceLinks item={item} />
      </div>
    </div>
  )
}

function ResourceLinks({ item }: { item: SheetItem }) {
  return (
    <>
      {item.topic && (
        <Link
          href={`/topics/${item.topic}`}
          title="Study Topic"
          className="text-zinc-600 hover:text-blue-400 transition-colors"
        >
          <BookOpen size={14} />
        </Link>
      )}
      {item.hasCode && (
        <Link href="/code-lab" title="Practice in Code Lab" className="text-zinc-600 hover:text-green-400 transition-colors">
          <Code2 size={14} />
        </Link>
      )}
      {item.hasFlashcard && (
        <Link href="/flashcards" title="Flashcard Revision" className="text-zinc-600 hover:text-yellow-400 transition-colors">
          <Layers size={14} />
        </Link>
      )}
      {item.hasQuiz && (
        <Link href="/quiz" title="Take Quiz" className="text-zinc-600 hover:text-violet-400 transition-colors">
          <HelpCircle size={14} />
        </Link>
      )}
      {item.hasInterview && (
        <Link href="/interview" title="Mock Interview" className="text-zinc-600 hover:text-orange-400 transition-colors">
          <MessageCircle size={14} />
        </Link>
      )}
    </>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SheetClient() {
  const [progress, setProgress] = useState<Record<string, boolean>>({})
  const [activeTrack, setActiveTrack] = useState(SHEET_TRACKS[0].id)
  const [filterType, setFilterType] = useState<ItemType | 'all'>('all')
  const [filterDiff, setFilterDiff] = useState<Difficulty | 'all'>('all')
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    [SHEET_TRACKS[0].sections[0].id]: true,
  })
  const [mounted, setMounted] = useState(false)

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
    const track = SHEET_TRACKS.find(t => t.id === trackId)
    if (track?.sections[0]) {
      setOpenSections({ [track.sections[0].id]: true })
    }
  }, [])

  const resetProgress = useCallback(() => {
    if (confirm('Reset all progress? This cannot be undone.')) {
      saveProgress({})
    }
  }, [saveProgress])

  // ── Stats ──────────────────────────────────────────────────────────────────

  const totalItems = useMemo(() => getTotalItems(), [])

  const doneItems = useMemo(
    () => SHEET_TRACKS.reduce(
      (sum, t) => sum + t.sections.reduce((s, sec) => s + sec.items.filter(i => progress[i.id]).length, 0),
      0
    ),
    [progress]
  )

  const overallPct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0

  // ── Active track ──────────────────────────────────────────────────────────

  const activeTrackData = SHEET_TRACKS.find(t => t.id === activeTrack)!

  const trackAllItems = useMemo(
    () => activeTrackData.sections.flatMap(s => s.items),
    [activeTrackData]
  )
  const trackDone = trackAllItems.filter(i => progress[i.id]).length
  const trackPct = trackAllItems.length > 0 ? Math.round((trackDone / trackAllItems.length) * 100) : 0

  const filteredSections = useMemo(
    () =>
      activeTrackData.sections
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
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-10">
          <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 mb-4 tracking-wide uppercase">
            2026 Edition
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-zinc-100 mb-3 tracking-tight">
            AI A2Z Interview Sheet
          </h1>
          <p className="text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto">
            The most complete AI/ML interview prep sheet. Cover everything from Transformers to
            Production MLOps — theory, code, projects &amp; mock interviews.
          </p>
        </div>

        {/* ── Overall Stats ───────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Total Topics', value: totalItems, color: 'text-zinc-100' },
            { label: 'Completed', value: mounted ? doneItems : 0, color: 'text-orange-400' },
            { label: 'Progress', value: `${mounted ? overallPct : 0}%`, color: 'text-emerald-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 text-center">
              <div className={`text-2xl sm:text-3xl font-extrabold ${color}`}>{value}</div>
              <div className="text-xs text-zinc-500 mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* ── Overall Progress Bar ────────────────────────────────────── */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 mb-8">
          <div className="flex items-center justify-between text-sm mb-2.5">
            <span className="text-zinc-400 font-medium">Overall Progress</span>
            <div className="flex items-center gap-3">
              <span className="text-zinc-500 text-xs">{mounted ? doneItems : 0}/{totalItems} topics</span>
              <button
                onClick={resetProgress}
                title="Reset all progress"
                className="text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                <RotateCcw size={13} />
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
            <p className="text-emerald-400 text-xs font-semibold mt-2 text-center">
              🎉 Sheet Complete — You&apos;re Interview Ready!
            </p>
          )}
        </div>

        {/* ── Track Tabs ──────────────────────────────────────────────── */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent -mx-4 px-4">
          {SHEET_TRACKS.map(track => {
            const tItems = track.sections.flatMap(s => s.items)
            const tDone = tItems.filter(i => progress[i.id]).length
            const isActive = activeTrack === track.id
            return (
              <button
                key={track.id}
                onClick={() => handleTrackChange(track.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all border flex-shrink-0 ${
                  isActive
                    ? `${track.bg} ${track.color} border-current/30`
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                <span>{track.icon}</span>
                <span>{track.title}</span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-md font-semibold ${
                    isActive ? 'bg-black/20 text-current' : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {mounted ? tDone : 0}/{tItems.length}
                </span>
              </button>
            )
          })}
        </div>

        {/* ── Active Track Header ─────────────────────────────────────── */}
        <div className={`border rounded-2xl p-5 mb-5 ${activeTrackData.bg}`}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className={`text-lg font-bold mb-1 ${activeTrackData.color}`}>
                {activeTrackData.icon} {activeTrackData.title}
              </h2>
              <p className="text-zinc-400 text-sm max-w-xl">{activeTrackData.description}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <div className={`text-2xl font-extrabold ${activeTrackData.color}`}>
                {mounted ? trackPct : 0}%
              </div>
              <div className="text-xs text-zinc-500">{mounted ? trackDone : 0}/{trackAllItems.length} done</div>
            </div>
          </div>
          <div className="mt-4 h-1.5 bg-black/20 rounded-full overflow-hidden">
            <div
              className={`h-full ${activeTrackData.bar} rounded-full transition-all duration-500`}
              style={{ width: `${mounted ? trackPct : 0}%` }}
            />
          </div>
        </div>

        {/* ── Filters ─────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <span className="flex items-center gap-1.5 text-xs text-zinc-500 mr-1">
            <Filter size={12} /> Filter:
          </span>
          {(['all', 'theory', 'code', 'project', 'interview'] as const).map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                filterType === t
                  ? 'bg-orange-500/10 border-orange-500/40 text-orange-400'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
              }`}
            >
              {t === 'all' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
          <div className="hidden sm:block w-px h-4 bg-zinc-800" />
          {(['all', 'easy', 'medium', 'hard'] as const).map(d => (
            <button
              key={d}
              onClick={() => setFilterDiff(d)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                filterDiff === d
                  ? 'bg-orange-500/10 border-orange-500/40 text-orange-400'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
              }`}
            >
              {d === 'all' ? 'All Levels' : d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>

        {/* ── Legend ──────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-6 text-[11px] text-zinc-600">
          <span className="font-medium text-zinc-500 mr-1">Resources:</span>
          {[
            { icon: <BookOpen size={12} />, label: 'Topic Study' },
            { icon: <Code2 size={12} />, label: 'Code Lab' },
            { icon: <Layers size={12} />, label: 'Flashcards' },
            { icon: <HelpCircle size={12} />, label: 'Quiz' },
            { icon: <MessageCircle size={12} />, label: 'Mock Interview' },
          ].map(({ icon, label }) => (
            <span key={label} className="flex items-center gap-1">
              {icon} {label}
            </span>
          ))}
        </div>

        {/* ── Sections ────────────────────────────────────────────────── */}
        {filteredSections.length === 0 ? (
          <div className="text-center py-16">
            <Target size={36} className="text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500">No items match the current filters.</p>
            <button
              onClick={() => { setFilterType('all'); setFilterDiff('all') }}
              className="text-xs text-orange-400 hover:text-orange-300 mt-2"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSections.map(section => {
              const sectionDone = section.items.filter(i => progress[i.id]).length
              const sectionPct = section.items.length > 0
                ? Math.round((sectionDone / section.items.length) * 100)
                : 0
              const isComplete = mounted && sectionDone === section.items.length && section.items.length > 0
              const isOpen = openSections[section.id] ?? false

              return (
                <div
                  key={section.id}
                  className={`bg-zinc-900 border rounded-2xl overflow-hidden transition-colors ${
                    isComplete ? 'border-emerald-500/30' : 'border-zinc-800'
                  }`}
                >
                  {/* Section Header */}
                  <div className="flex items-center justify-between px-4 py-3.5">
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="flex items-center gap-2.5 flex-1 text-left min-w-0"
                    >
                      <span className="text-zinc-500 flex-shrink-0">
                        {isOpen
                          ? <ChevronDown size={15} />
                          : <ChevronRight size={15} />
                        }
                      </span>
                      <span className="font-semibold text-zinc-200 text-sm sm:text-base truncate">
                        {section.title}
                      </span>
                      <span className="text-xs text-zinc-600 flex-shrink-0 hidden sm:inline">
                        {section.items.length} topics
                      </span>
                    </button>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      {/* Mark all button */}
                      <button
                        onClick={() => markSectionAll(section.items, sectionDone < section.items.length)}
                        title={sectionDone < section.items.length ? 'Mark all done' : 'Unmark all'}
                        className="text-zinc-600 hover:text-zinc-400 transition-colors hidden sm:block"
                      >
                        <CheckSquare size={14} />
                      </button>

                      {/* Progress */}
                      <div className="hidden sm:flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${activeTrackData.bar} rounded-full transition-all duration-300`}
                            style={{ width: `${mounted ? sectionPct : 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-zinc-500 w-10 text-right">
                          {mounted ? sectionDone : 0}/{section.items.length}
                        </span>
                      </div>

                      {isComplete && (
                        <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                          <Trophy size={11} /> Done
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Items */}
                  {isOpen && (
                    <div className="border-t border-zinc-800">
                      {/* Table header (desktop only) */}
                      <div className="hidden sm:grid grid-cols-[28px_1fr_auto_auto_auto] gap-x-4 px-4 py-2 text-[11px] font-semibold text-zinc-600 uppercase tracking-wider border-b border-zinc-800/60 bg-zinc-950/40">
                        <span />
                        <span>Topic</span>
                        <span>Type</span>
                        <span>Level</span>
                        <span>Resources</span>
                      </div>
                      <div className="divide-y divide-zinc-800/50">
                        {section.items.map(it => (
                          <SheetRow
                            key={it.id}
                            item={it}
                            done={!!progress[it.id]}
                            onToggle={() => toggleItem(it.id)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ── Bottom CTA ──────────────────────────────────────────────── */}
        <div className="mt-10 text-center">
          <p className="text-zinc-600 text-sm">
            Practice everything hands-on →{' '}
            <Link href="/code-lab" className="text-orange-400 hover:text-orange-300 transition-colors font-medium">
              Code Lab
            </Link>
            {' · '}
            <Link href="/quiz" className="text-orange-400 hover:text-orange-300 transition-colors font-medium">
              Take a Quiz
            </Link>
            {' · '}
            <Link href="/interview" className="text-orange-400 hover:text-orange-300 transition-colors font-medium">
              Mock Interview
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
