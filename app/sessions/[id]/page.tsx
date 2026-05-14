"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, BrainCircuit, Trophy, Clock, CheckCircle2,
  XCircle, AlertCircle, Lightbulb, Target, RotateCcw, ChevronDown, ChevronUp,
} from 'lucide-react'
import { SessionPageSkeleton } from '@/components/ui/SkeletonCard'

interface Entry {
  question:    string
  answer:      string | null
  score:       number | null
  grade:       string | null
  verdict:     string | null
  correct:     string[]
  missing:     string[]
  modelAnswer: string | null
  tip:         string | null
  timeUsed:    number
}

interface Session {
  id: string; topic: string; level: string; question_count: number
  avg_score: number; grade: string; created_at: string; entries: Entry[]
}

function gradeColor(g: string | null) {
  if (!g) return 'text-zinc-500'
  if (g.startsWith('A')) return 'text-green-400'
  if (g === 'B') return 'text-blue-400'
  if (g === 'C') return 'text-yellow-400'
  return 'text-red-400'
}

function gradeBg(g: string | null) {
  if (!g) return 'bg-zinc-800 border-zinc-700'
  if (g.startsWith('A')) return 'bg-green-500/10 border-green-500/20'
  if (g === 'B') return 'bg-blue-500/10 border-blue-500/20'
  if (g === 'C') return 'bg-yellow-500/10 border-yellow-500/20'
  return 'bg-red-500/10 border-red-500/20'
}

function scoreBarColor(s: number | null) {
  if (!s) return 'bg-zinc-600'
  if (s >= 8) return 'bg-green-500'
  if (s >= 6) return 'bg-blue-500'
  if (s >= 4) return 'bg-yellow-500'
  return 'bg-red-500'
}

function formatTime(secs: number) {
  const m = Math.floor(secs / 60); const s = secs % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

export default function SessionReplayPage() {
  const { id } = useParams()
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)

  useEffect(() => {
    if (!id) return
    fetch(`/api/user/sessions/${id}`)
      .then(r => { if (!r.ok) throw new Error('Not found'); return r.json() })
      .then(d => setSession(d.session))
      .catch(() => setError('Session not found or you don\'t have access.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 pt-24 pb-16">
      <SessionPageSkeleton />
    </div>
  )

  if (error || !session) return (
    <div className="min-h-screen bg-zinc-950 pt-20 flex items-center justify-center px-4">
      <div className="text-center">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-4" />
        <p className="text-zinc-300 font-semibold mb-4">{error || 'Session not found'}</p>
        <Link href="/dashboard" className="text-orange-400 hover:text-orange-300 text-sm">← Back to Dashboard</Link>
      </div>
    </div>
  )

  const entries: Entry[] = Array.isArray(session.entries) ? session.entries : []
  const scored   = entries.filter(e => e.score !== null)
  const date     = new Date(session.created_at).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const avgTime  = entries.length > 0 ? Math.round(entries.reduce((a, e) => a + (e.timeUsed || 0), 0) / entries.length) : 0

  return (
    <div className="min-h-screen bg-zinc-950 pt-20 pb-16">
      <div className="max-w-3xl mx-auto px-4">

        {/* Back */}
        <Link href="/dashboard" className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 mb-8 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </Link>

        {/* Header */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BrainCircuit className="w-5 h-5 text-orange-400" />
                <h1 className="text-xl font-bold text-zinc-100">{session.topic} · {session.level}</h1>
              </div>
              <p className="text-xs text-zinc-500">{date}</p>
            </div>
            <div className={`flex flex-col items-center px-4 py-2 rounded-xl border ${gradeBg(session.grade)}`}>
              <span className={`text-2xl font-extrabold ${gradeColor(session.grade)}`}>{session.grade}</span>
              <span className="text-[10px] text-zinc-500">Grade</span>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: <Target className="w-4 h-4 text-blue-400" />, label: 'Avg Score', value: `${session.avg_score.toFixed(1)}/10` },
              { icon: <Trophy className="w-4 h-4 text-yellow-400" />, label: 'Questions', value: `${session.question_count}` },
              { icon: <Clock className="w-4 h-4 text-green-400" />, label: 'Avg Time', value: formatTime(avgTime) },
            ].map(s => (
              <div key={s.label} className="bg-zinc-800/50 rounded-xl p-3 text-center">
                <div className="flex justify-center mb-1">{s.icon}</div>
                <p className="text-sm font-bold text-zinc-100">{s.value}</p>
                <p className="text-[10px] text-zinc-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Score distribution */}
        {scored.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-6">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">Score per Question</p>
            <div className="flex items-end gap-2 h-20">
              {entries.map((e, i) => {
                const pct = e.score !== null ? (e.score / 10) * 100 : 20
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-t-md transition-all" style={{ height: `${pct}%`, backgroundColor: e.score !== null ? (e.score >= 8 ? '#4ade80' : e.score >= 6 ? '#60a5fa' : e.score >= 4 ? '#facc15' : '#f87171') : '#3f3f46' }} />
                    <span className="text-[9px] text-zinc-600">{i + 1}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Questions */}
        {entries.length === 0 ? (
          <div className="text-center py-12 bg-zinc-900 border border-zinc-800 rounded-2xl">
            <AlertCircle className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">No question details available for this session.</p>
            <p className="text-zinc-700 text-xs mt-1">Detailed replay is available for sessions taken after this feature was added.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Questions ({entries.length})</p>
            {entries.map((entry, i) => (
              <div key={i} className={`bg-zinc-900 border rounded-2xl overflow-hidden transition-all ${gradeBg(entry.grade)}`}>
                <button
                  onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                  className="w-full flex items-start gap-4 p-4 text-left hover:bg-zinc-800/30 transition-colors"
                >
                  {/* Number */}
                  <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${gradeBg(entry.grade)}`}>
                    <span className={`text-xs font-extrabold ${gradeColor(entry.grade)}`}>{i + 1}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-200 leading-relaxed line-clamp-2 mb-2">{entry.question}</p>
                    <div className="flex items-center gap-3">
                      {entry.score !== null ? (
                        <>
                          <div className="flex items-center gap-1.5">
                            <div className="h-1.5 w-20 bg-zinc-700 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${scoreBarColor(entry.score)}`} style={{ width: `${(entry.score / 10) * 100}%` }} />
                            </div>
                            <span className={`text-xs font-bold ${gradeColor(entry.grade)}`}>{entry.score}/10</span>
                          </div>
                          <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {formatTime(entry.timeUsed || 0)}
                          </span>
                        </>
                      ) : (
                        <span className="text-[10px] text-zinc-600">No score recorded</span>
                      )}
                    </div>
                  </div>

                  {expandedIdx === i
                    ? <ChevronUp className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
                    : <ChevronDown className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />}
                </button>

                {expandedIdx === i && (
                  <div className="px-4 pb-4 border-t border-zinc-800 pt-3 flex flex-col gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {entry.verdict && <span className="text-[10px] font-bold text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full">{entry.verdict}</span>}
                      {entry.score !== null && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${entry.score >= 8 ? 'bg-green-500/15 text-green-400' : entry.score >= 6 ? 'bg-blue-500/15 text-blue-400' : entry.score >= 4 ? 'bg-yellow-500/15 text-yellow-400' : 'bg-red-500/15 text-red-400'}`}>
                          {entry.score >= 8 ? '✓ Strong' : entry.score >= 6 ? '◑ Good' : entry.score >= 4 ? '△ Needs work' : '✗ Weak'}
                        </span>
                      )}
                      <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                        <Clock className="w-3 h-3" />{formatTime(entry.timeUsed || 0)}
                      </span>
                    </div>

                    {/* Your answer */}
                    {entry.answer && (
                      <div>
                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-wide mb-1.5">Your Answer</p>
                        <p className="text-xs text-zinc-400 leading-relaxed bg-zinc-800/50 rounded-xl p-3">{entry.answer}</p>
                      </div>
                    )}

                    {/* What you got right / missed */}
                    {((entry.correct?.length || 0) > 0 || (entry.missing?.length || 0) > 0) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(entry.correct?.length || 0) > 0 && (
                          <div className="bg-green-500/5 border border-green-500/15 rounded-xl p-3">
                            <p className="text-[10px] font-bold text-green-400 mb-1.5">Covered ✓</p>
                            {entry.correct?.map((c, ci) => <p key={ci} className="text-[10px] text-zinc-400 leading-snug">• {c}</p>)}
                          </div>
                        )}
                        {(entry.missing?.length || 0) > 0 && (
                          <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-3">
                            <p className="text-[10px] font-bold text-red-400 mb-1.5">Missed ✗</p>
                            {entry.missing?.map((m, mi) => <p key={mi} className="text-[10px] text-zinc-400 leading-snug">• {m}</p>)}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Model answer */}
                    {entry.modelAnswer && (
                      <div>
                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-wide mb-1.5">Model Answer</p>
                        <p className="text-xs text-zinc-300 leading-relaxed bg-orange-500/5 border border-orange-500/15 rounded-xl p-3">{entry.modelAnswer}</p>
                      </div>
                    )}

                    {/* Tip */}
                    {entry.tip && (
                      <p className="text-[10px] text-orange-400/80 italic flex items-start gap-1.5">
                        <Lightbulb className="w-3 h-3 shrink-0 mt-0.5" />{entry.tip}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Practice again */}
        <div className="mt-8 flex gap-3">
          <Link href={`/interview?tab=simulator`}
            className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/20">
            <RotateCcw className="w-4 h-4" /> Practice {session.topic} Again
          </Link>
          <button onClick={() => router.back()}
            className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-sm font-semibold px-5 py-3.5 rounded-xl transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>
      </div>
    </div>
  )
}
