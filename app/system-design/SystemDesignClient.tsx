'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { ArrowRight, Search, X, CheckCircle2, CircleDot, Circle, Filter } from 'lucide-react'
import { DESIGN_TEMPLATE } from '@/lib/system-design-problems'

export interface SDItem {
  slug: string
  title: string
  difficulty: 'Medium' | 'Hard'
  companies: string[]
  category: string
}

const STORAGE_PREFIX = 'sd_design_v2_'
const TEMPLATE_WORDS = DESIGN_TEMPLATE.split(/\s+/).filter(Boolean).length

const DIFF_COLOR: Record<string, string> = {
  Hard:   'text-red-400 bg-red-500/10 border-red-500/25',
  Medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/25',
}

const CATEGORY_META: Record<string, { color: string; bar: string; dot: string }> = {
  'LLM Infrastructure': { color: 'text-violet-400 bg-violet-500/10 border-violet-500/25', bar: 'bg-violet-500', dot: 'bg-violet-400' },
  'ML Systems':         { color: 'text-blue-400 bg-blue-500/10 border-blue-500/25',       bar: 'bg-blue-500',   dot: 'bg-blue-400'   },
  'Classic Tech':       { color: 'text-green-400 bg-green-500/10 border-green-500/25',     bar: 'bg-green-500',  dot: 'bg-green-400'  },
}

const CATEGORIES = ['All', 'LLM Infrastructure', 'ML Systems', 'Classic Tech'] as const
const DIFFICULTIES = ['All', 'Medium', 'Hard'] as const

function abbr(c: string) {
  return c === 'Microsoft' ? 'MSFT' : c === 'Anthropic' ? 'Anth' : c === 'DeepMind' ? 'DeepM' : c
}

export default function SystemDesignClient({ problems }: { problems: SDItem[] }) {
  const [words, setWords]   = useState<Record<string, number>>({})
  const [mounted, setMounted] = useState(false)
  const [cat, setCat]       = useState<(typeof CATEGORIES)[number]>('All')
  const [diff, setDiff]     = useState<(typeof DIFFICULTIES)[number]>('All')
  const [query, setQuery]   = useState('')

  // Read each problem's saved work from localStorage to show progress.
  useEffect(() => {
    const w: Record<string, number> = {}
    for (const p of problems) {
      try {
        const raw = localStorage.getItem(STORAGE_PREFIX + p.slug)
        if (raw) {
          const parsed = JSON.parse(raw)
          w[p.slug] = (parsed.design ?? '').split(/\s+/).filter(Boolean).length
        }
      } catch { /* ignore */ }
    }
    setWords(w)
    setMounted(true)
  }, [problems])

  const started = (slug: string) => (words[slug] ?? 0) > TEMPLATE_WORDS + 15
  const startedCount = useMemo(() => problems.filter(p => started(p.slug)).length, [words, problems]) // eslint-disable-line react-hooks/exhaustive-deps
  const companyCount = useMemo(() => new Set(problems.flatMap(p => p.companies)).size, [problems])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return problems.filter(p =>
      (cat === 'All' || p.category === cat) &&
      (diff === 'All' || p.difficulty === diff) &&
      (!q || p.title.toLowerCase().includes(q) || p.companies.some(c => c.toLowerCase().includes(q)) || p.category.toLowerCase().includes(q)),
    )
  }, [problems, cat, diff, query])

  const pct = problems.length > 0 ? Math.round((startedCount / problems.length) * 100) : 0
  const hasFilters = cat !== 'All' || diff !== 'All' || query.trim()

  return (
    <>
      {/* ── Stats + progress ──────────────────────────────────────── */}
      <div className="bg-gradient-to-b from-zinc-900 to-zinc-900/40 border border-zinc-800 rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
          <div className="flex items-center gap-5">
            <Stat value={problems.length} label="Problems" />
            <Stat value={mounted ? startedCount : 0} label="Started" accent />
            <Stat value={companyCount} label="Companies" />
          </div>
          <div className="text-right">
            <div className="text-2xl font-extrabold text-violet-400">{mounted ? pct : 0}%</div>
            <div className="text-[10px] text-zinc-500">attempted</div>
          </div>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-700"
            style={{ width: `${mounted ? pct : 0}%` }} />
        </div>
        {mounted && startedCount > 0 && (
          <p className="text-[11px] text-zinc-500 mt-2">Your written designs auto-save in this browser — pick up where you left off.</p>
        )}
      </div>

      {/* ── Search + filters ──────────────────────────────────────── */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search problems or companies…"
            aria-label="Search system design problems"
            className="w-full pl-10 pr-9 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-violet-500/60 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors"
          />
          {query && (
            <button onClick={() => setQuery('')} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Filter size={12} className="text-zinc-600 mr-0.5" />
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className={`text-xs px-3 py-1 rounded-full border transition-all ${
                cat === c ? 'bg-violet-500/15 border-violet-500/40 text-violet-300' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
              }`}>
              {c}
            </button>
          ))}
          <div className="w-px h-3 bg-zinc-800 mx-1" />
          {DIFFICULTIES.map(d => (
            <button key={d} onClick={() => setDiff(d)}
              className={`text-xs px-3 py-1 rounded-full border transition-all ${
                diff === d ? 'bg-violet-500/15 border-violet-500/40 text-violet-300' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
              }`}>
              {d}
            </button>
          ))}
          {hasFilters && (
            <button onClick={() => { setCat('All'); setDiff('All'); setQuery('') }}
              className="text-xs text-zinc-500 hover:text-zinc-300 px-2 py-1 transition-colors">Clear</button>
          )}
          <span className="text-xs text-zinc-600 ml-auto">{filtered.length} shown</span>
        </div>
      </div>

      {/* ── Problem list ──────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-zinc-600 text-sm">
          No problems match.{' '}
          <button onClick={() => { setCat('All'); setDiff('All'); setQuery('') }} className="text-violet-400 hover:text-violet-300">Clear filters</button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((p, idx) => {
            const meta = CATEGORY_META[p.category] ?? { color: 'text-zinc-400 bg-zinc-800 border-zinc-700', bar: 'bg-zinc-500', dot: 'bg-zinc-400' }
            const wc = words[p.slug] ?? 0
            const isStarted = started(p.slug)
            return (
              <Link key={p.slug} href={`/system-design/${p.slug}`}
                className="group relative flex items-center gap-4 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl pl-4 pr-4 py-3.5 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 overflow-hidden">
                {/* Category accent bar */}
                <span className={`absolute left-0 top-0 bottom-0 w-1 ${meta.bar} opacity-70`} aria-hidden />

                {/* Status icon */}
                <span className="flex-shrink-0">
                  {!mounted ? <Circle size={16} className="text-zinc-800" />
                    : isStarted ? <CircleDot size={16} className="text-violet-400" />
                    : <Circle size={16} className="text-zinc-700 group-hover:text-zinc-500 transition-colors" />}
                </span>

                {/* Title + meta */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-zinc-100 group-hover:text-white transition-colors">{p.title}</p>
                    {mounted && isStarted && (
                      <span className="text-[10px] font-semibold text-violet-300 bg-violet-500/10 border border-violet-500/20 px-1.5 py-0.5 rounded-full">
                        in progress · {wc} words
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${meta.color}`}>{p.category}</span>
                    {p.companies.slice(0, 4).map(c => (
                      <span key={c} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 border border-zinc-700">
                        {abbr(c)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Difficulty */}
                <span className={`hidden sm:inline text-xs font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${DIFF_COLOR[p.difficulty] ?? ''}`}>
                  {p.difficulty}
                </span>

                <ArrowRight size={15} className="text-zinc-600 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}

function Stat({ value, label, accent }: { value: number; label: string; accent?: boolean }) {
  return (
    <div>
      <div className={`text-2xl font-extrabold ${accent ? 'text-violet-400' : 'text-zinc-100'} tabular-nums`}>{value}</div>
      <div className="text-[10px] text-zinc-500 uppercase tracking-wide">{label}</div>
    </div>
  )
}
