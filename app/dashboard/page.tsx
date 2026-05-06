import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { logout } from '@/app/actions/auth'
import { Trophy, BrainCircuit, TrendingUp, Calendar, LogOut, BarChart2 } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Progress Dashboard' }

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

function topicColor(topic: string) {
  const map: Record<string, string> = {
    LLM: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    RAG: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    Agents: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    'Fine-Tuning': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    MLOps: 'bg-green-500/20 text-green-300 border-green-500/30',
    Transformers: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
    'System Design': 'bg-red-500/20 text-red-300 border-red-500/30',
    Python: 'bg-lime-500/20 text-lime-300 border-lime-500/30',
    'Vector DB': 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  }
  return map[topic] ?? 'bg-zinc-700 text-zinc-300 border-zinc-600'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ─── Mini Bar Chart ───────────────────────────────────────────────────────────

function TrendChart({ sessions }: { sessions: Session[] }) {
  const last10 = [...sessions].reverse().slice(-10)
  const max = 10
  return (
    <div className="flex items-end gap-1.5 h-14">
      {last10.map((s, i) => {
        const pct = (s.avg_score / max) * 100
        const color = s.avg_score >= 8 ? 'bg-green-500' : s.avg_score >= 6 ? 'bg-blue-500' : s.avg_score >= 4 ? 'bg-yellow-500' : 'bg-red-500'
        return (
          <div key={s.id} className="flex flex-col items-center gap-1 flex-1" title={`${s.topic}: ${s.avg_score}/10`}>
            <div
              className={`w-full rounded-t-sm ${color} opacity-80 transition-all`}
              style={{ height: `${pct}%` }}
            />
            <span className="text-[9px] text-zinc-600">{i + 1}</span>
          </div>
        )
      })}
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
    .limit(50)

  const s = (sessions ?? []) as Session[]
  const totalSessions = s.length
  const overallAvg = totalSessions ? s.reduce((a, b) => a + b.avg_score, 0) / totalSessions : 0

  // Best topic by avg score (min 2 sessions)
  const topicMap: Record<string, number[]> = {}
  s.forEach((sess) => {
    topicMap[sess.topic] = [...(topicMap[sess.topic] ?? []), sess.avg_score]
  })
  const bestTopic = Object.entries(topicMap)
    .filter(([, scores]) => scores.length >= 2)
    .sort(([, a], [, b]) => (b.reduce((x, y) => x + y, 0) / b.length) - (a.reduce((x, y) => x + y, 0) / a.length))
    [0]?.[0] ?? '—'

  // Weak topic (lowest avg, min 2 sessions)
  const weakTopic = Object.entries(topicMap)
    .filter(([, scores]) => scores.length >= 2)
    .sort(([, a], [, b]) => (a.reduce((x, y) => x + y, 0) / a.length) - (b.reduce((x, y) => x + y, 0) / b.length))
    [0]?.[0] ?? '—'

  const emailPrefix = user.email?.split('@')[0] ?? 'User'

  return (
    <div className="min-h-screen bg-zinc-950 pt-20 pb-16">
      <div className="max-w-3xl mx-auto px-4">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">My Progress</h1>
            <p className="text-sm text-zinc-500 mt-1">Hi, {emailPrefix} — here&apos;s your interview history</p>
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
          /* Empty state */
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
            <BrainCircuit className="w-10 h-10 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-300 font-semibold mb-1">No sessions yet</p>
            <p className="text-zinc-500 text-sm mb-6">Complete an interview to start tracking your progress.</p>
            <a
              href="/interview"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold px-5 py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/20"
            >
              Start Interview Practice
            </a>
          </div>
        ) : (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { icon: <Trophy className="w-4 h-4" />, label: 'Sessions',   value: String(totalSessions),           color: 'text-yellow-400' },
                { icon: <BarChart2 className="w-4 h-4" />, label: 'Avg Score', value: `${overallAvg.toFixed(1)}/10`,  color: 'text-blue-400' },
                { icon: <TrendingUp className="w-4 h-4" />, label: 'Best Topic', value: bestTopic,                    color: 'text-green-400' },
                { icon: <Calendar className="w-4 h-4" />,  label: 'Weak Topic', value: weakTopic,                    color: 'text-red-400' },
              ].map((stat) => (
                <div key={stat.label} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                  <div className={`mb-2 ${stat.color}`}>{stat.icon}</div>
                  <p className="text-xs text-zinc-500 mb-0.5">{stat.label}</p>
                  <p className="text-sm font-bold text-zinc-100 truncate">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Trend chart */}
            {s.length >= 3 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-6">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-4">Score Trend (last {Math.min(s.length, 10)} sessions)</p>
                <TrendChart sessions={s} />
              </div>
            )}

            {/* Sessions list */}
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">All Sessions</p>
              {s.map((sess) => (
                <div
                  key={sess.id}
                  className={`bg-zinc-900 border rounded-2xl p-4 flex items-center gap-4 ${gradeBg(sess.grade)}`}
                >
                  {/* Grade badge */}
                  <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${gradeBg(sess.grade)}`}>
                    <span className={`text-lg font-extrabold ${gradeColor(sess.grade)}`}>{sess.grade}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${topicColor(sess.topic)}`}>
                        {sess.topic}
                      </span>
                      <span className="text-xs text-zinc-500">{sess.level}</span>
                      <span className="text-xs text-zinc-600">· {sess.question_count}Q</span>
                    </div>
                    <p className="text-xs text-zinc-500">{formatDate(sess.created_at)}</p>
                  </div>

                  {/* Score */}
                  <div className="text-right shrink-0">
                    <p className={`text-lg font-bold ${gradeColor(sess.grade)}`}>{sess.avg_score.toFixed(1)}</p>
                    <p className="text-xs text-zinc-600">/10</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-8 text-center">
              <a
                href="/interview"
                className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/20"
              >
                <BrainCircuit className="w-4 h-4" /> Practice Again
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
