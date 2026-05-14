'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BrainCircuit, Clock, Trophy, ArrowRight, Loader2, AlertCircle, RotateCcw } from 'lucide-react'

interface Session {
  id: string
  topic: string
  level: string
  question_count: number
  avg_score: number
  grade: string
  created_at: string
}

function gradeColor(g: string) {
  if (g.startsWith('A')) return 'text-green-400'
  if (g === 'B') return 'text-blue-400'
  if (g === 'C') return 'text-yellow-400'
  return 'text-red-400'
}

function gradeBg(g: string) {
  if (g.startsWith('A')) return 'bg-green-500/10 border-green-500/20'
  if (g === 'B') return 'bg-blue-500/10 border-blue-500/20'
  if (g === 'C') return 'bg-yellow-500/10 border-yellow-500/20'
  return 'bg-red-500/10 border-red-500/20'
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const d = Math.floor(diff / 86400000)
  if (d === 0) return 'Today'
  if (d === 1) return 'Yesterday'
  if (d < 7) return `${d} days ago`
  if (d < 30) return `${Math.floor(d / 7)}w ago`
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export default function SessionsPage() {
  const router = useRouter()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterTopic, setFilterTopic] = useState('All')
  const [sortBy, setSortBy] = useState<'recent' | 'best' | 'worst'>('recent')

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
    })
    fetch('/api/user/sessions')
      .then(r => { if (!r.ok) throw new Error('Failed'); return r.json() })
      .then(d => setSessions(d.sessions ?? []))
      .catch(() => setError('Failed to load sessions'))
      .finally(() => setLoading(false))
  }, [router])

  const avgScore = sessions.length
    ? (sessions.reduce((a, s) => a + s.avg_score, 0) / sessions.length).toFixed(1)
    : null

  const bestGrade = sessions.length
    ? sessions.reduce((best, s) => s.avg_score > best.avg_score ? s : best, sessions[0]).grade
    : null

  const topics = ['All', ...new Set(sessions.map(s => s.topic))]

  const displayed = [...sessions]
    .filter(s => filterTopic === 'All' || s.topic === filterTopic)
    .sort((a, b) => {
      if (sortBy === 'best') return b.avg_score - a.avg_score
      if (sortBy === 'worst') return a.avg_score - b.avg_score
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  return (
    <div className="min-h-screen bg-zinc-950 pt-20 pb-16">
      <div className="max-w-3xl mx-auto px-4">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs text-zinc-500 mb-3">
            <Link href="/dashboard" className="hover:text-zinc-300 transition-colors">Dashboard</Link>
            <span>/</span>
            <span className="text-zinc-300">Sessions</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-zinc-100 mb-1">Interview History</h1>
              <p className="text-sm text-zinc-500">All your past mock interview sessions</p>
            </div>
            <Link
              href="/interview?tab=simulator"
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/20 shrink-0"
            >
              <BrainCircuit className="w-4 h-4" /> New Session
            </Link>
          </div>
        </div>

        {/* Stats bar */}
        {!loading && sessions.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Total Sessions', value: String(sessions.length), color: 'text-zinc-100' },
              { label: 'Avg Score', value: `${avgScore}/10`, color: 'text-blue-400' },
              { label: 'Best Grade', value: bestGrade ?? '—', color: gradeColor(bestGrade ?? 'F') },
            ].map(s => (
              <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
                <p className={`text-lg font-extrabold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-7 h-7 text-zinc-600 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <p className="text-zinc-400 text-sm mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> Try Again
            </button>
          </div>
        ) : sessions.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
            <BrainCircuit className="w-10 h-10 text-zinc-700 mx-auto mb-4" />
            <h2 className="text-zinc-300 font-bold mb-2">No sessions yet</h2>
            <p className="text-zinc-600 text-sm mb-6">Complete your first mock interview to see it here</p>
            <Link
              href="/interview?tab=simulator"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold px-5 py-3 rounded-xl transition-all"
            >
              <BrainCircuit className="w-4 h-4" /> Start First Session
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Filter + Sort controls */}
            <div className="mb-4 flex flex-col gap-3">
              {/* Topic pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                {topics.map(t => (
                  <button key={t} onClick={() => setFilterTopic(t)}
                    className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                      filterTopic === t
                        ? 'bg-orange-500 border-orange-500 text-white'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}>{t}</button>
                ))}
              </div>
              {/* Sort */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-zinc-500 mr-1">Sort:</span>
                {(['recent', 'best', 'worst'] as const).map(s => (
                  <button key={s} onClick={() => setSortBy(s)}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors capitalize ${
                      sortBy === s ? 'bg-zinc-700 border-zinc-600 text-zinc-100' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                    }`}>{s === 'recent' ? 'Recent' : s === 'best' ? 'Best Score' : 'Needs Work'}</button>
                ))}
                {filterTopic !== 'All' && (
                  <span className="text-xs text-zinc-500 ml-auto">{displayed.length} of {sessions.length}</span>
                )}
              </div>
            </div>

            {/* Empty state when filter returns nothing */}
            {displayed.length === 0 && sessions.length > 0 && (
              <div className="text-center py-12 text-zinc-500 text-sm">
                No {filterTopic} sessions yet.{' '}
                <button onClick={() => setFilterTopic('All')} className="text-orange-400 hover:text-orange-300">Clear filter</button>
              </div>
            )}

            {displayed.map(s => (
              <Link
                key={s.id}
                href={`/sessions/${s.id}`}
                className="group bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-4 flex items-center gap-4 transition-all hover:bg-zinc-900/80"
              >
                {/* Grade badge */}
                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${gradeBg(s.grade)}`}>
                  <span className={`text-lg font-extrabold ${gradeColor(s.grade)}`}>{s.grade}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-zinc-200 truncate">{s.topic}</p>
                    <span className="text-xs text-zinc-600 shrink-0">{s.level}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Trophy className="w-3 h-3" /> {s.avg_score.toFixed(1)}/10
                    </span>
                    <span className="flex items-center gap-1">
                      <BrainCircuit className="w-3 h-3" /> {s.question_count}Q
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {timeAgo(s.created_at)}
                    </span>
                  </div>
                </div>

                {/* Score bar */}
                <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                  <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${s.avg_score >= 8 ? 'bg-green-500' : s.avg_score >= 6 ? 'bg-blue-500' : s.avg_score >= 4 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${(s.avg_score / 10) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-zinc-600">{s.avg_score.toFixed(1)}/10</span>
                </div>

                <ArrowRight className="w-4 h-4 text-zinc-700 group-hover:text-zinc-400 transition-colors shrink-0" />
              </Link>
            ))}

            {sessions.length >= 50 && (
              <p className="text-center text-xs text-zinc-600 pt-2">Showing latest 50 sessions</p>
            )}
          </div>
        )}

        {/* Retry CTA */}
        {!loading && sessions.length > 0 && (
          <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-zinc-200 mb-0.5">Keep improving</p>
              <p className="text-xs text-zinc-500">Each session brings you closer to your target score</p>
            </div>
            <Link
              href="/interview?tab=simulator"
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shrink-0"
            >
              <RotateCcw className="w-4 h-4" /> Practice Again
            </Link>
          </div>
        )}

      </div>
    </div>
  )
}
