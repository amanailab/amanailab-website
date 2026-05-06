import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { logout } from '@/app/actions/auth'
import {
  Trophy, BrainCircuit, TrendingUp, LogOut,
  Target, Flame, Star, AlertTriangle, ArrowRight,
  CheckCircle2, BookOpen,
} from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'
import ScoreLineChart from '@/components/dashboard/ScoreLineChart'

export const metadata: Metadata = { title: 'My Progress Dashboard | AmanAI Lab' }

// ─── Types ────────────────────────────────────────────────────────────────────

interface Session {
  id: string
  topic: string
  level: string
  question_count: number
  avg_score: number
  grade: string
  created_at: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TOPIC_COLORS: Record<string, string> = {
  LLM:           'bg-blue-500/20 text-blue-300 border-blue-500/30',
  RAG:           'bg-violet-500/20 text-violet-300 border-violet-500/30',
  Agents:        'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'Fine-Tuning': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  MLOps:         'bg-green-500/20 text-green-300 border-green-500/30',
  Transformers:  'bg-teal-500/20 text-teal-300 border-teal-500/30',
  'System Design':'bg-red-500/20 text-red-300 border-red-500/30',
  Python:        'bg-lime-500/20 text-lime-300 border-lime-500/30',
  'Vector DB':   'bg-pink-500/20 text-pink-300 border-pink-500/30',
}

const TOPIC_BAR: Record<string, string> = {
  LLM:           'bg-blue-500',
  RAG:           'bg-violet-500',
  Agents:        'bg-orange-500',
  'Fine-Tuning': 'bg-yellow-500',
  MLOps:         'bg-green-500',
  Transformers:  'bg-teal-500',
  'System Design':'bg-red-500',
  Python:        'bg-lime-500',
  'Vector DB':   'bg-pink-500',
}

const ALL_TOPICS = ['LLM','RAG','Agents','Fine-Tuning','MLOps','Transformers','System Design','Python','Vector DB']

function gradeColor(g: string) {
  if (g.startsWith('A')) return 'text-green-400'
  if (g === 'B')         return 'text-blue-400'
  if (g === 'C')         return 'text-yellow-400'
  return 'text-red-400'
}

function gradeBg(g: string) {
  if (g.startsWith('A')) return 'bg-green-500/10 border-green-500/20'
  if (g === 'B')         return 'bg-blue-500/10 border-blue-500/20'
  if (g === 'C')         return 'bg-yellow-500/10 border-yellow-500/20'
  return 'bg-red-500/10 border-red-500/20'
}

function scoreBarColor(s: number) {
  if (s >= 8) return 'bg-green-500'
  if (s >= 6) return 'bg-blue-500'
  if (s >= 4) return 'bg-yellow-500'
  return 'bg-red-500'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return formatDate(iso)
}

function calcStreak(sessions: Session[]): number {
  if (!sessions.length) return 0
  const dates = [...new Set(sessions.map(s => s.created_at.split('T')[0]))]
    .sort((a, b) => b.localeCompare(a))
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  if (dates[0] !== today && dates[0] !== yesterday) return 0
  let streak = 1
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]).getTime()
    const curr = new Date(dates[i]).getTime()
    if ((prev - curr) / 86400000 <= 1.5) streak++
    else break
  }
  return streak
}

function calcReadiness(sessions: Session[]): number {
  if (!sessions.length) return 0
  const coveredTopics = new Set(sessions.map(s => s.topic)).size
  const topicScore = (coveredTopics / ALL_TOPICS.length) * 30
  const avg = sessions.reduce((a, b) => a + b.avg_score, 0) / sessions.length
  const perfScore = (avg / 10) * 50
  const consistencyScore = Math.min(sessions.length / 10, 1) * 20
  return Math.min(Math.round(topicScore + perfScore + consistencyScore), 100)
}

function readinessLabel(r: number) {
  if (r >= 80) return { label: 'Interview Ready', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' }
  if (r >= 60) return { label: 'Almost Ready',    color: 'text-blue-400',  bg: 'bg-blue-500/10 border-blue-500/20'  }
  if (r >= 40) return { label: 'Developing',      color: 'text-yellow-400',bg: 'bg-yellow-500/10 border-yellow-500/20' }
  return              { label: 'Just Starting',   color: 'text-zinc-400',  bg: 'bg-zinc-800 border-zinc-700'         }
}

// ─── Readiness Arc ────────────────────────────────────────────────────────────

function ReadinessArc({ score }: { score: number }) {
  const radius = 64
  const circ = Math.PI * radius // half circle
  const dash = circ * (score / 100)
  const color = score >= 80 ? '#4ade80' : score >= 60 ? '#60a5fa' : score >= 40 ? '#facc15' : '#71717a'
  const label = readinessLabel(score)

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width="160" height="90" viewBox="0 0 160 90">
          <path d="M 12 80 A 68 68 0 0 1 148 80" fill="none" stroke="#27272a" strokeWidth="10" strokeLinecap="round" />
          <path
            d="M 12 80 A 68 68 0 0 1 148 80"
            fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(.4,0,.2,1)' }}
          />
          <text x="80" y="72" textAnchor="middle" fill={color} fontSize="26" fontWeight="800">{score}</text>
          <text x="80" y="86" textAnchor="middle" fill="#52525b" fontSize="9">/ 100</text>
        </svg>
      </div>
      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border mt-1 ${label.bg} ${label.color}`}>
        {label.label}
      </span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: sessions } = await supabase
    .from('user_interview_sessions')
    .select('id, topic, level, question_count, avg_score, grade, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  const s = (sessions ?? []) as Session[]
  const totalSessions = s.length
  const overallAvg = totalSessions ? s.reduce((a, b) => a + b.avg_score, 0) / totalSessions : 0
  const bestScore = totalSessions ? Math.max(...s.map(x => x.avg_score)) : 0
  const streak = calcStreak(s)
  const readiness = calcReadiness(s)
  const emailPrefix = user.email?.split('@')[0] ?? 'there'
  const lastPracticed = s[0] ? timeAgo(s[0].created_at) : null

  // Per-topic mastery
  const topicMap: Record<string, number[]> = {}
  s.forEach(sess => {
    topicMap[sess.topic] = [...(topicMap[sess.topic] ?? []), sess.avg_score]
  })
  const topicStats = Object.entries(topicMap).map(([topic, scores]) => ({
    topic,
    avg: scores.reduce((a, b) => a + b, 0) / scores.length,
    sessions: scores.length,
    best: Math.max(...scores),
    trend: scores.length >= 2 ? scores[0] - scores[scores.length - 1] : 0,
  })).sort((a, b) => b.avg - a.avg)

  const bestTopic   = topicStats[0]?.topic ?? null
  const weakTopic   = [...topicStats].sort((a, b) => a.avg - b.avg)[0]?.topic ?? null
  const nextTopic   = topicStats.find(t => t.avg < 7)?.topic
    ?? ALL_TOPICS.find(t => !topicMap[t])
    ?? null

  // Chart data (oldest first, max 20)
  const chartPoints = [...s].reverse().slice(-20).map(sess => ({
    topic: sess.topic,
    score: sess.avg_score,
    date: sess.created_at,
  }))

  // Uncovered topics
  const coveredTopics = new Set(s.map(x => x.topic))
  const uncoveredTopics = ALL_TOPICS.filter(t => !coveredTopics.has(t))

  return (
    <div className="min-h-screen bg-zinc-950 pt-20 pb-16">
      <div className="max-w-4xl mx-auto px-4">

        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-extrabold text-zinc-100">Hi, {emailPrefix}!</h1>
              {streak >= 3 && (
                <span className="flex items-center gap-1 text-xs font-semibold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full">
                  <Flame className="w-3 h-3" /> {streak}-day streak
                </span>
              )}
            </div>
            <p className="text-sm text-zinc-500">
              {lastPracticed ? `Last practiced: ${lastPracticed}` : 'Start your first session below'}
            </p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-lg transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </button>
          </form>
        </div>

        {totalSessions === 0 ? (

          /* ── Empty state ── */
          <div className="flex flex-col gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 text-center">
              <div className="w-16 h-16 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <BrainCircuit className="w-7 h-7 text-orange-400" />
              </div>
              <h2 className="text-lg font-bold text-zinc-100 mb-2">Your dashboard is empty</h2>
              <p className="text-zinc-500 text-sm mb-6 max-w-sm mx-auto">
                Complete your first interview session to see your readiness score, topic mastery, and progress over time.
              </p>
              <Link
                href="/interview"
                className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/20"
              >
                Start Interview Practice <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Topics to cover */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-4">Topics to master</p>
              <div className="flex flex-wrap gap-2">
                {ALL_TOPICS.map(t => (
                  <span key={t} className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${TOPIC_COLORS[t] ?? 'bg-zinc-800 text-zinc-300 border-zinc-700'}`}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>

        ) : (

          <div className="flex flex-col gap-5">

            {/* ── Readiness + Stats ── */}
            <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4">

              {/* Readiness arc */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center gap-2">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Interview Readiness</p>
                <ReadinessArc score={readiness} />
                <p className="text-xs text-zinc-600 text-center max-w-[140px]">
                  Based on {coveredTopics.size}/{ALL_TOPICS.length} topics covered
                </p>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
                {[
                  { icon: <Trophy className="w-4 h-4" />,    label: 'Sessions',     value: String(totalSessions),      sub: 'total completed',        color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
                  { icon: <Target className="w-4 h-4" />,    label: 'Avg Score',    value: `${overallAvg.toFixed(1)}/10`, sub: 'across all sessions',  color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20' },
                  { icon: <Star className="w-4 h-4" />,      label: 'Personal Best',value: `${bestScore.toFixed(1)}/10`,  sub: 'highest session avg',  color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20' },
                  { icon: <Flame className="w-4 h-4" />,     label: 'Practice Streak', value: streak > 0 ? `${streak} day${streak > 1 ? 's' : ''}` : '—', sub: streak > 0 ? 'keep it up!' : 'practice today', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
                  { icon: <CheckCircle2 className="w-4 h-4" />, label: 'Best Topic', value: bestTopic ?? '—', sub: 'highest avg score',       color: 'text-teal-400',   bg: 'bg-teal-500/10 border-teal-500/20' },
                  { icon: <AlertTriangle className="w-4 h-4" />, label: 'Needs Work', value: weakTopic ?? '—', sub: 'lowest avg score',        color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20' },
                ].map((stat) => (
                  <div key={stat.label} className={`rounded-2xl border p-4 flex flex-col gap-1 ${stat.bg}`}>
                    <div className={`${stat.color}`}>{stat.icon}</div>
                    <p className="text-xs text-zinc-500">{stat.label}</p>
                    <p className="text-sm font-bold text-zinc-100 truncate">{stat.value}</p>
                    <p className="text-[10px] text-zinc-600">{stat.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Score Trend ── */}
            {chartPoints.length >= 2 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-bold text-zinc-100">Score Trend</p>
                    <p className="text-xs text-zinc-500">Last {chartPoints.length} sessions — hover to inspect</p>
                  </div>
                  <TrendingUp className="w-4 h-4 text-zinc-600" />
                </div>
                <ScoreLineChart points={chartPoints} />
                {/* Legend */}
                <div className="flex items-center gap-4 mt-3 flex-wrap">
                  {[['≥8', '#4ade80', 'Strong'], ['≥6', '#60a5fa', 'Good'], ['≥4', '#facc15', 'Fair'], ['<4', '#f87171', 'Weak']].map(([range, color, label]) => (
                    <div key={range} className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-[10px] text-zinc-500">{range} {label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Topic Mastery ── */}
            {topicStats.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-sm font-bold text-zinc-100">Topic Mastery</p>
                    <p className="text-xs text-zinc-500">{topicStats.length} topics practiced · {uncoveredTopics.length} remaining</p>
                  </div>
                  <BookOpen className="w-4 h-4 text-zinc-600" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {topicStats.map(({ topic, avg, sessions: sc, trend }) => {
                    const bar = TOPIC_BAR[topic] ?? 'bg-zinc-500'
                    const badge = TOPIC_COLORS[topic] ?? 'bg-zinc-800 text-zinc-300 border-zinc-700'
                    return (
                      <div key={topic} className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-3.5">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${badge}`}>{topic}</span>
                          <div className="flex items-center gap-2">
                            {trend > 0.5 && <span className="text-[10px] text-green-400 font-semibold">↑ improving</span>}
                            {trend < -0.5 && <span className="text-[10px] text-red-400 font-semibold">↓ declining</span>}
                            <span className={`text-sm font-extrabold ${scoreBarColor(avg).replace('bg-', 'text-').replace('-500', '-400')}`}>
                              {avg.toFixed(1)}
                            </span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden mb-1.5">
                          <div
                            className={`h-full ${bar} opacity-80 rounded-full transition-all duration-700`}
                            style={{ width: `${(avg / 10) * 100}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-zinc-600">{sc} session{sc > 1 ? 's' : ''}</p>
                      </div>
                    )
                  })}
                </div>

                {/* Uncovered topics */}
                {uncoveredTopics.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-zinc-800">
                    <p className="text-xs text-zinc-600 mb-2">Topics not yet practiced:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {uncoveredTopics.map(t => (
                        <span key={t} className="text-[10px] font-medium text-zinc-600 bg-zinc-800/50 border border-zinc-700/50 px-2 py-0.5 rounded-full">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── What to practice next ── */}
            {nextTopic && (
              <div className="bg-gradient-to-r from-orange-500/10 to-orange-500/5 border border-orange-500/20 rounded-2xl p-5 flex items-center gap-4">
                <div className="w-10 h-10 bg-orange-500/15 border border-orange-500/25 rounded-xl flex items-center justify-center shrink-0">
                  <BrainCircuit className="w-5 h-5 text-orange-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-zinc-100 mb-0.5">Recommended next: {nextTopic}</p>
                  <p className="text-xs text-zinc-400">
                    {topicMap[nextTopic]
                      ? `Your current score: ${(topicMap[nextTopic].reduce((a,b)=>a+b,0)/topicMap[nextTopic].length).toFixed(1)}/10 — keep improving`
                      : `You haven't practiced this topic yet — it counts toward your readiness score`}
                  </p>
                </div>
                <Link
                  href="/interview"
                  className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-400 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/20 shrink-0"
                >
                  Practice <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            {/* ── Recent Sessions ── */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-4">Recent Sessions</p>
              <div className="flex flex-col gap-2.5">
                {s.slice(0, 8).map((sess) => (
                  <div
                    key={sess.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border ${gradeBg(sess.grade)}`}
                  >
                    {/* Grade */}
                    <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${gradeBg(sess.grade)}`}>
                      <span className={`text-sm font-extrabold ${gradeColor(sess.grade)}`}>{sess.grade}</span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full border ${TOPIC_COLORS[sess.topic] ?? 'bg-zinc-800 text-zinc-300 border-zinc-700'}`}>
                          {sess.topic}
                        </span>
                        <span className="text-[10px] text-zinc-500">{sess.level} · {sess.question_count}Q</span>
                      </div>
                      <p className="text-[10px] text-zinc-600 mt-0.5">{formatDate(sess.created_at)}</p>
                    </div>

                    {/* Score */}
                    <div className="text-right shrink-0">
                      <p className={`text-base font-extrabold ${gradeColor(sess.grade)}`}>{sess.avg_score.toFixed(1)}</p>
                      <p className="text-[10px] text-zinc-600">/10</p>
                    </div>
                  </div>
                ))}
              </div>

              {s.length > 8 && (
                <p className="text-xs text-zinc-600 text-center mt-3">{s.length - 8} older sessions not shown</p>
              )}
            </div>

            {/* ── Bottom CTA ── */}
            <div className="flex gap-3 pt-2">
              <Link
                href="/interview"
                className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/20"
              >
                <BrainCircuit className="w-4 h-4" /> New Practice Session
              </Link>
              <Link
                href="/"
                className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-sm font-semibold px-5 py-3.5 rounded-xl transition-colors"
              >
                All Tools
              </Link>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
