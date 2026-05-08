"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Code2, Flame, CheckCircle2, Lock, Minus } from 'lucide-react'

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
  const [solvedIds, setSolvedIds]     = useState<Set<string>>(new Set())
  const [attemptedIds, setAttemptedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch('/api/code-lab/progress').then(r => r.json()).then(d => {
      setSolvedIds(new Set(d.solved ?? []))
      setAttemptedIds(new Set(d.attempted ?? []))
    }).catch(() => {})
  }, [])

  const filtered = problems.filter(p => {
    const matchTopic  = topic === 'All'  || p.topic === topic
    const matchDiff   = diff  === 'All'  || p.difficulty === diff
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
    return matchTopic && matchDiff && matchSearch
  })

  const easy   = problems.filter(p => p.difficulty === 'Easy').length
  const medium = problems.filter(p => p.difficulty === 'Medium').length
  const hard   = problems.filter(p => p.difficulty === 'Hard').length

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
              <p className="text-xs text-zinc-500">Implement AI/ML algorithms from scratch — like LeetCode for AI engineers</p>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 mt-4 flex-wrap">
            {[
              { label: 'Total', value: problems.length, color: 'text-zinc-300' },
              { label: 'Easy',   value: easy,   color: 'text-green-400' },
              { label: 'Medium', value: medium, color: 'text-yellow-400' },
              { label: 'Hard',   value: hard,   color: 'text-red-400' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5">
                <span className={`text-sm font-extrabold ${s.color}`}>{s.value}</span>
                <span className="text-xs text-zinc-600">{s.label}</span>
              </div>
            ))}
          </div>
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
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-orange-500/50 rounded-xl pl-9 pr-4 py-2.5 text-sm text-zinc-300 placeholder:text-zinc-600 outline-none transition-colors"
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

        {/* Topic filter */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {TOPICS.map(t => (
            <button key={t} onClick={() => setTopic(t)}
              className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-all ${
                topic === t ? 'bg-zinc-200 border-zinc-200 text-zinc-900' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
              }`}>
              {t}
            </button>
          ))}
        </div>

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
              <div className="py-12 text-center text-zinc-600 text-sm">No problems match your filters</div>
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
                        <span key={tag} className="text-[9px] font-medium text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded">
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
                      <span key={c} className="text-[9px] text-zinc-600 bg-zinc-800/80 px-1.5 py-0.5 rounded border border-zinc-700/50">
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
