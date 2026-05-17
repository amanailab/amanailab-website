"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Code2, Flame, CheckCircle2, Lock, Minus, Zap } from 'lucide-react'

const LEVELS = [
  { min: 0,    max: 299,  label: 'ML Beginner',     color: 'text-zinc-400',   bg: 'bg-zinc-800/60',         bar: 'bg-zinc-500',    emoji: '🌱', xpLabel: '0 XP'    },
  { min: 300,  max: 699,  label: 'AI Explorer',     color: 'text-blue-400',   bg: 'bg-blue-500/10',          bar: 'bg-blue-500',    emoji: '🔭', xpLabel: '300 XP'  },
  { min: 700,  max: 1499, label: 'ML Practitioner', color: 'text-green-400',  bg: 'bg-green-500/10',         bar: 'bg-green-500',   emoji: '⚡', xpLabel: '700 XP'  },
  { min: 1500, max: 2999, label: 'AI Engineer',     color: 'text-violet-400', bg: 'bg-violet-500/10',        bar: 'bg-violet-500',  emoji: '🛠️', xpLabel: '1,500 XP'},
  { min: 3000, max: 4999, label: 'ML Expert',       color: 'text-orange-400', bg: 'bg-orange-500/10',        bar: 'bg-orange-500',  emoji: '🎯', xpLabel: '3,000 XP'},
  { min: 5000, max: Infinity, label: 'AI Master',   color: 'text-yellow-400', bg: 'bg-yellow-500/10',        bar: 'bg-yellow-400',  emoji: '👑', xpLabel: '5,000 XP'},
]

interface Problem {
  id: string; title: string; slug: string; difficulty: string
  topic: string; tags: string[]; companies: string[]; order_index: number
}

const DIFF_COLOR = {
  Easy:   'text-green-400 bg-green-500/10 border-green-500/25',
  Medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/25',
  Hard:   'text-red-400 bg-red-500/10 border-red-500/25',
} as const

const TOPICS = ['All', 'Math', 'NLP', 'Transformers', 'LLM', 'RAG', 'Vector DB', 'Deep Learning', 'Classical ML']
const DIFFS  = ['All', 'Easy', 'Medium', 'Hard']

export default function ProblemsClient({ problems }: { problems: Problem[] }) {
  const [topic, setTopic]   = useState('All')
  const [diff,  setDiff]    = useState('All')
  const [search, setSearch] = useState('')
  const [solvedIds, setSolvedIds]       = useState<Set<string>>(new Set())
  const [attemptedIds, setAttemptedIds] = useState<Set<string>>(new Set())
  const [xp, setXp]                     = useState(0)
  const [isLoggedIn, setIsLoggedIn]     = useState<boolean | null>(null)

  useEffect(() => {
    fetch('/api/code-lab/progress').then(r => r.json()).then(d => {
      setSolvedIds(new Set(d.solved ?? []))
      setAttemptedIds(new Set(d.attempted ?? []))
    }).catch(() => {})

    fetch('/api/code-lab/xp').then(r => r.json()).then(d => {
      setXp(d.xp ?? 0)
      // If API returns xp (even 0) without 401, user is logged in or guest
      setIsLoggedIn(true)
    }).catch(() => {
      setIsLoggedIn(false)
      try { setXp(parseInt(localStorage.getItem('codelab_xp') ?? '0')) } catch { /* ignore */ }
    })

    // Check auth state
    import('@/lib/supabase/client').then(({ createClient }) => {
      createClient().auth.getSession().then(({ data: { session } }) => {
        setIsLoggedIn(!!session)
      })
    })
  }, [])

  const currentLevel = LEVELS.slice().reverse().find(l => xp >= l.min) ?? LEVELS[0]

  const filtered = problems.filter(p => {
    const matchTopic  = topic === 'All'  || p.topic === topic
    const matchDiff   = diff  === 'All'  || p.difficulty === diff
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
    return matchTopic && matchDiff && matchSearch
  })

  const easy        = problems.filter(p => p.difficulty === 'Easy').length
  const medium      = problems.filter(p => p.difficulty === 'Medium').length
  const hard        = problems.filter(p => p.difficulty === 'Hard').length
  const solvedCount = problems.filter(p => solvedIds.has(p.id)).length
  const progressPct = problems.length > 0 ? Math.round(solvedCount / problems.length * 100) : 0
  const nextProblem = filtered.find(p => !solvedIds.has(p.id))

  return (
    <div className="min-h-screen bg-zinc-950 pt-20 pb-16">
      <div className="max-w-5xl mx-auto px-4">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center justify-center">
              <Code2 className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-zinc-100">AI/ML Code Lab</h1>
              <p className="text-xs text-zinc-500">Implement AI/ML algorithms from scratch — earn XP, unlock levels, master real interview problems</p>
            </div>
          </div>

          {/* Stats + Progress */}
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              {[
                { label: 'Total',  value: problems.length, color: 'text-zinc-300' },
                { label: 'Easy',   value: easy,            color: 'text-green-400'  },
                { label: 'Medium', value: medium,          color: 'text-yellow-400' },
                { label: 'Hard',   value: hard,            color: 'text-red-400'    },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5">
                  <span className={`text-sm font-extrabold ${s.color}`}>{s.value}</span>
                  <span className="text-xs text-zinc-600">{s.label}</span>
                </div>
              ))}
              {solvedCount > 0 && (
                <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/25 rounded-lg px-3 py-1.5">
                  <span className="text-sm font-extrabold text-emerald-400">{solvedCount}</span>
                  <span className="text-xs text-emerald-600">Solved</span>
                </div>
              )}
            </div>
            {/* Progress bar */}
            {solvedCount > 0 && (
              <div>
                <div className="flex justify-between text-[10px] text-zinc-600 mb-1">
                  <span>{solvedCount}/{problems.length} problems solved</span>
                  <span className="font-semibold text-emerald-500">{progressPct}%</span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full transition-all duration-700"
                    style={{ width: `${progressPct}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* XP Level Roadmap */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className={`w-4 h-4 ${isLoggedIn ? currentLevel.color : 'text-zinc-600'}`} />
              <span className="text-sm font-bold text-zinc-200">XP Levels</span>
            </div>
            {isLoggedIn === null ? (
              <div className="h-6 w-32 bg-zinc-800 rounded-full animate-pulse" />
            ) : isLoggedIn ? (
              <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${currentLevel.bg} ${currentLevel.color}`}>
                {currentLevel.emoji} {currentLevel.label} · {xp.toLocaleString()} XP
              </span>
            ) : (
              <Link href="/login" className="text-xs text-orange-400 hover:text-orange-300 font-semibold transition-colors">
                Login to track XP →
              </Link>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {LEVELS.map((level, i) => {
              const unlocked = xp >= level.min
              const isCurrent = currentLevel.label === level.label
              return (
                <div
                  key={level.label}
                  className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${
                    isCurrent
                      ? `${level.bg} border-current/30 ring-1 ring-current/20`
                      : unlocked
                        ? `${level.bg} opacity-80`
                        : 'bg-zinc-900/50 border-zinc-800/50 opacity-40'
                  }`}
                >
                  {isCurrent && (
                    <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-orange-400 bg-zinc-950 px-1.5 rounded-full border border-orange-500/20">
                      YOU
                    </span>
                  )}
                  <span className="text-2xl">{level.emoji}</span>
                  <span className={`text-[10px] font-bold leading-tight ${unlocked ? level.color : 'text-zinc-600'}`}>
                    {level.label}
                  </span>
                  <span className="text-[9px] text-zinc-600">{level.xpLabel}</span>
                  {!unlocked && (
                    <Lock className="w-3 h-3 text-zinc-700 absolute bottom-2 right-2" />
                  )}
                  {unlocked && !isCurrent && (
                    <CheckCircle2 className="w-3 h-3 text-green-500 absolute bottom-2 right-2" />
                  )}
                </div>
              )
            })}
          </div>

          {/* XP progress bar or login CTA */}
          {isLoggedIn === null ? (
            <div className="mt-4 h-1.5 w-full bg-zinc-800 rounded-full animate-pulse" />
          ) : isLoggedIn === false ? (
            <div className="mt-4 bg-orange-500/5 border border-orange-500/15 rounded-xl px-4 py-3 text-center">
              <p className="text-xs text-zinc-500 mb-1.5">Your XP and level progress will be saved here once you sign in.</p>
              <Link href="/login" className="text-xs font-semibold text-orange-400 hover:text-orange-300 transition-colors">
                Sign in free to start earning XP →
              </Link>
            </div>
          ) : (() => {
            const nextL = LEVELS.find(l => l.min > xp)
            if (!nextL) return (
              <p className="text-xs text-yellow-400 text-center mt-3 font-bold">👑 You&apos;ve reached AI Master — the highest level!</p>
            )
            const pct = Math.round(((xp - currentLevel.min) / (nextL.min - currentLevel.min)) * 100)
            return (
              <div className="mt-4">
                <div className="flex justify-between text-[10px] text-zinc-600 mb-1.5">
                  <span>{xp.toLocaleString()} XP</span>
                  <span>{nextL.min - xp} XP to {nextL.emoji} {nextL.label}</span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ${currentLevel.bar}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })()}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-zinc-600 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search problems…"
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-orange-500/50 rounded-xl pl-9 pr-4 py-2.5 text-sm text-zinc-300 placeholder:text-zinc-500 outline-none transition-colors"
            />
          </div>

          {/* Difficulty filter */}
          <div className="flex items-center gap-1.5">
            {DIFFS.map(d => (
              <button key={d} onClick={() => setDiff(d)}
                className={`text-xs font-semibold px-3 py-2 rounded-lg border transition-all ${
                  diff === d ? 'bg-orange-500 border-orange-500 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                }`}>
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Topic filter — horizontal scroll on mobile */}
        <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-thin scrollbar-thumb-zinc-800">
          {TOPICS.map(t => (
            <button key={t} onClick={() => setTopic(t)}
              className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1.5 rounded-full border transition-all ${
                topic === t ? 'bg-zinc-200 border-zinc-200 text-zinc-900' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
              }`}>
              {t}
            </button>
          ))}
        </div>

        {/* Next problem indicator */}
        {nextProblem && solvedCount > 0 && (
          <div className="flex items-center gap-3 px-4 py-2.5 mb-4 bg-zinc-900 border border-orange-500/20 rounded-xl">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0 animate-pulse" />
            <span className="text-xs text-zinc-500 flex-shrink-0">Continue →</span>
            <Link href={`/code-lab/${nextProblem.slug}`}
              className="text-xs font-semibold text-zinc-300 hover:text-orange-300 transition-colors truncate">
              {nextProblem.title}
            </Link>
            <span className={`ml-auto flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${DIFF_COLOR[nextProblem.difficulty as keyof typeof DIFF_COLOR] ?? ''}`}>
              {nextProblem.difficulty}
            </span>
          </div>
        )}

        {/* Problems table */}
        {problems.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
            <Code2 className="w-10 h-10 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-400 font-semibold mb-2">No problems loaded yet</p>
            <p className="text-zinc-600 text-sm mb-6">Run the SQL migration in Supabase, then seed the problems from the admin panel.</p>
            <Link href="/admin/code-problems" className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
              Go to Admin → Seed Problems
            </Link>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[40px_1fr_100px_120px_160px] gap-4 px-5 py-3 border-b border-zinc-800 text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
              <span>#</span>
              <span>Title</span>
              <span>Difficulty</span>
              <span>Topic</span>
              <span className="hidden sm:block">Companies</span>
            </div>

            {filtered.length === 0 ? (
              <div className="py-14 text-center flex flex-col items-center gap-2">
                <Code2 className="w-8 h-8 text-zinc-700 mb-1" />
                <p className="text-zinc-400 font-semibold text-sm">No problems match your filters</p>
                <button onClick={() => { setTopic('All'); setDiff('All'); setSearch('') }} className="text-xs text-orange-400 hover:text-orange-300 transition-colors">
                  Clear filters
                </button>
              </div>
            ) : (
              filtered.map((p, i) => (
                <Link
                  key={p.id}
                  href={`/code-lab/${p.slug}`}
                  className="grid grid-cols-[40px_1fr_100px_120px_160px] gap-4 px-5 py-4 border-b border-zinc-800/60 hover:bg-zinc-800/40 transition-colors items-center group"
                >
                  <div className="flex items-center justify-center" title={solvedIds.has(p.id)?'Solved':attemptedIds.has(p.id)?'Attempted':''}>
                    {solvedIds.has(p.id)
                      ? <CheckCircle2 className="w-4 h-4 text-green-400" />
                      : attemptedIds.has(p.id)
                        ? <Minus className="w-4 h-4 text-yellow-400" />
                        : <span className="text-xs text-zinc-600 font-mono">{p.order_index}</span>
                    }
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors">
                      {p.title}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {p.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[9px] font-medium text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <span className={`text-xs font-bold px-2 py-1 rounded-full border w-fit ${DIFF_COLOR[p.difficulty as keyof typeof DIFF_COLOR] ?? ''}`}>
                    {p.difficulty}
                  </span>

                  <span className="text-xs text-zinc-500">{p.topic}</span>

                  <div className="hidden sm:flex flex-wrap gap-1">
                    {p.companies.slice(0, 2).map(c => (
                      <span key={c} className="text-[9px] text-zinc-500 bg-zinc-800/80 px-1.5 py-0.5 rounded border border-zinc-700/50">
                        {c}
                      </span>
                    ))}
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {filtered.length > 0 && (
          <p className="text-xs text-zinc-700 text-center mt-4">{filtered.length} problems</p>
        )}
      </div>
    </div>
  )
}
