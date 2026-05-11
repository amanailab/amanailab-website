"use client"

import { useEffect, useState, useCallback } from 'react'
import {
  Flame, CheckCircle2, XCircle, ChevronDown, ChevronUp,
  Sparkles, Trophy, Clock, ArrowRight, RotateCcw,
} from 'lucide-react'
import Link from 'next/link'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface DailyQuestion {
  id: number
  question: string
  topic: string
  level: string
}

interface EvalResult {
  score: number
  verdict: string
  feedback: string
  key_points_covered: string[]
  key_points_missed: string[]
  model_answer_highlight: string
  model_answer: string
}

interface StoredEntry {
  date: string
  questionId: number
  answer: string
  result: EvalResult
}

// ─── Streak helpers ─────────────────────────────────────────────────────────────

const STORAGE_HISTORY = 'daily_challenge_history'
const STORAGE_ENTRY   = 'daily_challenge_entry'

function loadHistory(): string[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(STORAGE_HISTORY) ?? '[]') } catch { return [] }
}

// Use local date (YYYY-MM-DD) to avoid timezone issues — toISOString() uses UTC
function localDateStr(date: Date = new Date()): string {
  return date.toLocaleDateString('en-CA') // en-CA gives YYYY-MM-DD format
}

function calcStreak(history: string[], todayDate: string): number {
  const dates = [...new Set([...history])].sort((a, b) => b.localeCompare(a))
  const today = todayDate
  const yesterday = localDateStr(new Date(Date.now() - 86400000))
  if (!dates.includes(today) && !dates.includes(yesterday)) return 0
  let streak = 0
  let cursor = today
  for (let i = 0; i < 365; i++) {
    if (dates.includes(cursor)) {
      streak++
      cursor = localDateStr(new Date(new Date(cursor).getTime() - 86400000))
    } else {
      if (cursor === today) { cursor = yesterday; continue }
      break
    }
  }
  return streak
}

function timeUntilMidnight(): string {
  const now = new Date()
  // Use local midnight — daily challenge resets at midnight in the user's timezone
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  const diff = tomorrow.getTime() - now.getTime()
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  return `${h}h ${m}m`
}

function verdictColor(v: string) {
  if (v === 'Excellent') return 'text-green-400 bg-green-500/10 border-green-500/30'
  if (v === 'Good')      return 'text-blue-400 bg-blue-500/10 border-blue-500/30'
  if (v === 'Needs Work') return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
  return 'text-red-400 bg-red-500/10 border-red-500/30'
}

function scoreColor(s: number) {
  if (s >= 8) return '#4ade80'
  if (s >= 6) return '#60a5fa'
  if (s >= 4) return '#facc15'
  return '#f87171'
}

function ScoreCircle({ score }: { score: number }) {
  const r = 42
  const circ = 2 * Math.PI * r
  const dash = circ * (score / 10)
  const color = scoreColor(score)
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="110" height="110" viewBox="0 0 110 110">
        <circle cx="55" cy="55" r={r} fill="none" stroke="#27272a" strokeWidth="8" />
        <circle cx="55" cy="55" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeLinecap="round" strokeDasharray={`${dash} ${circ}`}
          strokeDashoffset={circ / 4}
          style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(.4,0,.2,1)' }} />
        <text x="55" y="52" textAnchor="middle" fill={color} fontSize="24" fontWeight="800">{score}</text>
        <text x="55" y="66" textAnchor="middle" fill="#52525b" fontSize="11">/10</text>
      </svg>
      <span className="text-xs text-zinc-500">Score</span>
    </div>
  )
}

// ─── Page ───────────────────────────────────────────────────────────────────────

// Clean up history entries older than 60 days to prevent localStorage bloat
function pruneHistory(history: string[]): string[] {
  const cutoff = localDateStr(new Date(Date.now() - 60 * 86400000))
  return history.filter(d => d >= cutoff)
}

export default function DailyChallengePage() {
  const [question, setQuestion]         = useState<DailyQuestion | null>(null)
  const [todayDate, setTodayDate]       = useState('')
  const [answer, setAnswer]             = useState('')
  const [submitting, setSubmitting]     = useState(false)
  const [result, setResult]             = useState<EvalResult | null>(null)
  const [alreadyDone, setAlreadyDone]   = useState(false)
  const [showFull, setShowFull]         = useState(false)
  const [countdown, setCountdown]       = useState('')
  const [streak, setStreak]             = useState(0)
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState('')

  // Load question + check if already done today
  useEffect(() => {
    async function init() {
      try {
        const res = await fetch('/api/daily/question')
        if (!res.ok) throw new Error('Failed to load')
        const data = await res.json()
        setQuestion(data.question)
        setTodayDate(data.date)

        const history = loadHistory()
        const s = calcStreak(history, data.date)
        setStreak(s)

        const stored: StoredEntry | null = (() => {
          try { return JSON.parse(localStorage.getItem(STORAGE_ENTRY) ?? 'null') } catch { return null }
        })()
        if (stored && stored.date === data.date) {
          setResult(stored.result)
          setAnswer(stored.answer)
          setAlreadyDone(true)
        }
      } catch {
        setError("Could not load today’s challenge. Please try again.")
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  // Countdown timer
  useEffect(() => {
    setCountdown(timeUntilMidnight())
    const id = setInterval(() => setCountdown(timeUntilMidnight()), 60000)
    return () => clearInterval(id)
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!question || !answer.trim() || submitting) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/daily/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: question.id, userAnswer: answer }),
      })
      if (!res.ok) throw new Error('Evaluation failed')
      const ev: EvalResult = await res.json()
      setResult(ev)
      setAlreadyDone(true)

      // Fire confetti on good scores
      if (ev.score >= 7) {
        import('canvas-confetti').then(({ default: confetti }) => {
          const colors = ev.score >= 9
            ? ['#facc15', '#f97316', '#ec4899', '#8b5cf6']
            : ['#f97316', '#fb923c', '#fbbf24', '#ffffff']
          confetti({ particleCount: ev.score >= 9 ? 150 : 100, spread: 70, origin: { y: 0.6 }, colors })
        })
      }

      // Persist to localStorage (instant)
      const entry: StoredEntry = { date: todayDate, questionId: question.id, answer, result: ev }
      localStorage.setItem(STORAGE_ENTRY, JSON.stringify(entry))

      const history = loadHistory()
      if (!history.includes(todayDate)) {
        const updated = pruneHistory([...history, todayDate])
        localStorage.setItem(STORAGE_HISTORY, JSON.stringify(updated))
        setStreak(calcStreak(updated, todayDate))
      }

      // Also save to server for logged-in users (streak persists across devices)
      fetch('/api/daily/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: todayDate, questionId: question.id, score: ev.score }),
      }).then(r => r.json()).then(d => {
        if (d.xp_awarded > 0) {
          // Sync XP to localStorage so Code Lab XP card updates
          try {
            const cur = parseInt(localStorage.getItem('codelab_xp') ?? '0')
            localStorage.setItem('codelab_xp', String(cur + d.xp_awarded))
          } catch { /* ignore */ }
        }
      }).catch(() => { /* non-critical */ })
    } catch {
      setError('Evaluation failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }, [question, answer, submitting, todayDate])

  const topicColors: Record<string, string> = {
    LLM: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    RAG: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    Agents: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    'Fine-Tuning': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    MLOps: 'bg-green-500/20 text-green-300 border-green-500/30',
    Transformers: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
    'System Design': 'bg-red-500/20 text-red-300 border-red-500/30',
    Python: 'bg-lime-500/20 text-lime-300 border-lime-500/30',
    'Vector DB': 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    'Computer Vision': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    NLP: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    Statistics: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    'SQL & Data': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    Behavioral: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  }

  const levelColors: Record<string, string> = {
    Fresher: 'bg-green-500/10 text-green-400 border-green-500/20',
    Mid:     'bg-blue-500/10 text-blue-400 border-blue-500/20',
    Senior:  'bg-purple-500/10 text-purple-400 border-purple-500/20',
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center pt-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm">Loading today's challenge…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 pt-20 pb-20">
      <div className="max-w-2xl mx-auto px-4">

        {/* ── Header ── */}
        <div className="flex flex-col items-center text-center mb-8 gap-3">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/25 text-orange-400 text-xs font-semibold px-3.5 py-1.5 rounded-full uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Daily Challenge
          </div>
          <h1 className="text-3xl font-bold text-zinc-100">
            {alreadyDone ? "Today's Result" : "Answer Today's Question"}
          </h1>
          <p className="text-zinc-500 text-sm">
            {new Date(todayDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>

          {/* Streak + countdown */}
          <div className="flex items-center gap-4 mt-1">
            {streak > 0 && (
              <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-full">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-xs font-bold text-orange-400">{streak}-day streak</span>
              </div>
            )}
            {alreadyDone && (
              <div className="flex items-center gap-1.5 bg-zinc-800 border border-zinc-700 px-3 py-1.5 rounded-full">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-xs text-zinc-500">Next in {countdown}</span>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl mb-6 text-center">
            {error}
          </div>
        )}

        {question && (
          <div className="flex flex-col gap-5">

            {/* ── Question card ── */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${topicColors[question.topic] ?? 'bg-zinc-800 text-zinc-300 border-zinc-700'}`}>
                  {question.topic}
                </span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${levelColors[question.level] ?? 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                  {question.level}
                </span>
              </div>
              <p className="text-zinc-100 text-base leading-relaxed font-medium">
                {question.question}
              </p>
            </div>

            {/* ── Answer area or result ── */}
            {!alreadyDone ? (
              <div className="flex flex-col gap-4">
                <textarea
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  placeholder="Write your answer here… Aim for 3-5 sentences covering the key concepts."
                  rows={7}
                  className="w-full bg-zinc-900 border border-zinc-700 focus:border-orange-500/60 rounded-xl px-4 py-3 text-zinc-200 text-sm resize-none outline-none transition-colors placeholder:text-zinc-600"
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-zinc-600">{answer.length} characters</p>
                  <button
                    onClick={handleSubmit}
                    disabled={!answer.trim() || submitting}
                    className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/20"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Evaluating…
                      </>
                    ) : (
                      <>
                        Submit Answer <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : result && (
              <div className="flex flex-col gap-4">

                {/* Score + verdict */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6">
                  <ScoreCircle score={result.score} />
                  <div className="flex-1 text-center sm:text-left">
                    <span className={`inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-full border mb-3 ${verdictColor(result.verdict)}`}>
                      <Trophy className="w-3.5 h-3.5" />
                      {result.verdict}
                    </span>
                    <p className="text-zinc-300 text-sm leading-relaxed">{result.feedback}</p>
                  </div>
                </div>

                {/* Key points */}
                {(result.key_points_covered.length > 0 || result.key_points_missed.length > 0) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {result.key_points_covered.length > 0 && (
                      <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4">
                        <p className="text-xs font-bold text-green-400 mb-3 uppercase tracking-wide">Covered</p>
                        <ul className="flex flex-col gap-2">
                          {result.key_points_covered.map((pt, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
                              {pt}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {result.key_points_missed.length > 0 && (
                      <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                        <p className="text-xs font-bold text-red-400 mb-3 uppercase tracking-wide">Missed</p>
                        <ul className="flex flex-col gap-2">
                          {result.key_points_missed.map((pt, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                              <XCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                              {pt}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Model answer */}
                {result.model_answer_highlight && (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                    <button
                      onClick={() => setShowFull(!showFull)}
                      className="w-full flex items-center justify-between px-5 py-4 hover:bg-zinc-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-orange-400" />
                        <span className="text-sm font-semibold text-zinc-200">Model Answer</span>
                      </div>
                      {showFull ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
                    </button>
                    <div className={`px-5 pb-5 flex flex-col gap-3 ${showFull ? '' : 'hidden'}`}>
                      {result.model_answer_highlight && (
                        <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-3">
                          <p className="text-xs font-semibold text-orange-400 mb-1.5">Key Insight</p>
                          <p className="text-sm text-zinc-300 leading-relaxed">{result.model_answer_highlight}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-semibold text-zinc-500 mb-1.5">Full Answer</p>
                        <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">{result.model_answer}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Your answer recap */}
                <details className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden group">
                  <summary className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-zinc-800/50 transition-colors list-none">
                    <span className="text-sm font-semibold text-zinc-400">Your Answer</span>
                    <RotateCcw className="w-3.5 h-3.5 text-zinc-600" />
                  </summary>
                  <p className="px-5 pb-5 text-sm text-zinc-500 leading-relaxed whitespace-pre-wrap">{answer}</p>
                </details>

              </div>
            )}

            {/* ── Bottom actions ── */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {alreadyDone ? (
                <>
                  <Link href="/interview?tab=simulator" className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/20">
                    Practice Full Interview <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link href="/questions" className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-sm font-semibold px-5 py-3 rounded-xl transition-colors">
                    Browse All Questions
                  </Link>
                </>
              ) : (
                <Link href="/questions" className="flex items-center justify-center gap-2 text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
                  Browse question bank instead <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
