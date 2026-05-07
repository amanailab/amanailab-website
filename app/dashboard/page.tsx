import { createClient } from '@/lib/supabase/server'
import { getAdminSupabase } from '@/lib/admin'
import { redirect } from 'next/navigation'
import { logout } from '@/app/actions/auth'
import {
  Trophy, BrainCircuit, TrendingUp, LogOut,
  Target, Flame, Star, AlertTriangle, ArrowRight,
  CheckCircle2, BookOpen, Building2, MessageSquare,
  Briefcase, Map, Library, Sparkles, Medal, Flame as FlameIcon,
  CalendarDays, Users,
} from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'
import ScoreLineChart from '@/components/dashboard/ScoreLineChart'
import DailyChallengeStrip from '@/components/dashboard/DailyChallengeStrip'

export const metadata: Metadata = { title: 'My Dashboard | AmanAI Lab' }

// ─── Types ────────────────────────────────────────────────────────────────────

interface Session {
  id: string; topic: string; level: string
  question_count: number; avg_score: number; grade: string; created_at: string
}

interface LeaderEntry {
  uid: string; avg: number; sessions: number; isYou: boolean
}

interface Achievement {
  id: string; emoji: string; label: string; desc: string
  unlocked: boolean; progress?: number; total?: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_TOPICS = [
  'LLM','RAG','Agents','Fine-Tuning','MLOps','Transformers',
  'System Design','Python','Vector DB','Computer Vision','NLP',
  'Statistics','SQL & Data','Behavioral',
]

const TOPIC_COLORS: Record<string, string> = {
  LLM:             'bg-blue-500/20 text-blue-300 border-blue-500/30',
  RAG:             'bg-violet-500/20 text-violet-300 border-violet-500/30',
  Agents:          'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'Fine-Tuning':   'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  MLOps:           'bg-green-500/20 text-green-300 border-green-500/30',
  Transformers:    'bg-teal-500/20 text-teal-300 border-teal-500/30',
  'System Design': 'bg-red-500/20 text-red-300 border-red-500/30',
  Python:          'bg-lime-500/20 text-lime-300 border-lime-500/30',
  'Vector DB':     'bg-pink-500/20 text-pink-300 border-pink-500/30',
  'Computer Vision':'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  NLP:             'bg-purple-500/20 text-purple-300 border-purple-500/30',
  Statistics:      'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'SQL & Data':    'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  Behavioral:      'bg-rose-500/20 text-rose-300 border-rose-500/30',
}

const TOPIC_BAR: Record<string, string> = {
  LLM:'bg-blue-500', RAG:'bg-violet-500', Agents:'bg-orange-500',
  'Fine-Tuning':'bg-yellow-500', MLOps:'bg-green-500', Transformers:'bg-teal-500',
  'System Design':'bg-red-500', Python:'bg-lime-500', 'Vector DB':'bg-pink-500',
  'Computer Vision':'bg-cyan-500', NLP:'bg-purple-500', Statistics:'bg-amber-500',
  'SQL & Data':'bg-emerald-500', Behavioral:'bg-rose-500',
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

function scoreBarColor(s: number) {
  if (s >= 8) return 'bg-green-500'
  if (s >= 6) return 'bg-blue-500'
  if (s >= 4) return 'bg-yellow-500'
  return 'bg-red-500'
}

function scoreTextColor(s: number) {
  if (s >= 8) return 'text-green-400'
  if (s >= 6) return 'text-blue-400'
  if (s >= 4) return 'text-yellow-400'
  return 'text-red-400'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7)  return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return formatDate(iso)
}

function calcStreak(sessions: Session[]): number {
  if (!sessions.length) return 0
  const dates = [...new Set(sessions.map(s => s.created_at.split('T')[0]))]
    .sort((a, b) => b.localeCompare(a))
  const today     = new Date().toISOString().split('T')[0]
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
  const coveredTopics   = new Set(sessions.map(s => s.topic)).size
  const topicScore      = (coveredTopics / ALL_TOPICS.length) * 30
  const avg             = sessions.reduce((a, b) => a + b.avg_score, 0) / sessions.length
  const perfScore       = (avg / 10) * 50
  const consistencyScore = Math.min(sessions.length / 10, 1) * 20
  return Math.min(Math.round(topicScore + perfScore + consistencyScore), 100)
}

function readinessLabel(r: number) {
  if (r >= 80) return { label: 'Interview Ready', color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20'  }
  if (r >= 60) return { label: 'Almost Ready',    color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20'    }
  if (r >= 40) return { label: 'Developing',      color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' }
  return              { label: 'Just Starting',   color: 'text-zinc-400',   bg: 'bg-zinc-800 border-zinc-700'           }
}

// ─── ReadinessArc ─────────────────────────────────────────────────────────────

function ReadinessArc({ score }: { score: number }) {
  const circ  = Math.PI * 64
  const dash  = circ * (score / 100)
  const color = score >= 80 ? '#4ade80' : score >= 60 ? '#60a5fa' : score >= 40 ? '#facc15' : '#71717a'
  const label = readinessLabel(score)
  return (
    <div className="flex flex-col items-center">
      <svg width="160" height="90" viewBox="0 0 160 90">
        <path d="M 12 80 A 68 68 0 0 1 148 80" fill="none" stroke="#27272a" strokeWidth="10" strokeLinecap="round" />
        <path d="M 12 80 A 68 68 0 0 1 148 80" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(.4,0,.2,1)' }} />
        <text x="80" y="72" textAnchor="middle" fill={color} fontSize="26" fontWeight="800">{score}</text>
        <text x="80" y="86" textAnchor="middle" fill="#52525b" fontSize="9">/ 100</text>
      </svg>
      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border mt-1 ${label.bg} ${label.color}`}>
        {label.label}
      </span>
    </div>
  )
}

// ─── LeaderboardCard ─────────────────────────────────────────────────────────

function LeaderboardCard({
  entries, nameMap, userRank, totalUsers,
}: {
  entries: LeaderEntry[]
  nameMap: Record<string, string>
  userRank: number
  totalUsers: number
}) {
  const rankColors = ['text-yellow-400', 'text-zinc-300', 'text-amber-600']
  const rankBg     = ['bg-yellow-500/10', 'bg-zinc-700/30', 'bg-amber-600/10']

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-400" />
          <p className="text-sm font-bold text-zinc-100">Leaderboard</p>
        </div>
        {userRank > 0 && (
          <span className="text-xs font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full">
            Rank #{userRank}
          </span>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-zinc-600 text-center">Practice to appear here</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5 flex-1">
          {entries.map((entry, i) => (
            <div
              key={entry.uid}
              className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border transition-all ${
                entry.isYou
                  ? 'bg-orange-500/10 border-orange-500/25'
                  : `${rankBg[i] ?? 'bg-zinc-800/30'} border-zinc-700/30`
              }`}
            >
              <span className={`text-xs font-extrabold w-4 shrink-0 ${rankColors[i] ?? 'text-zinc-600'}`}>
                {i + 1}
              </span>
              <span className={`text-xs font-semibold flex-1 truncate ${entry.isYou ? 'text-orange-300' : 'text-zinc-300'}`}>
                {entry.isYou ? 'You' : (nameMap[entry.uid] ?? 'user••')}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className={`text-xs font-extrabold ${scoreTextColor(entry.avg)}`}>
                  {entry.avg.toFixed(1)}
                </span>
                <span className="text-[9px] text-zinc-600">{entry.sessions}s</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
        <div className="flex items-center gap-1">
          <Users className="w-3 h-3 text-zinc-600" />
          <span className="text-[10px] text-zinc-600">{totalUsers} total users</span>
        </div>
        {userRank > 5 && (
          <span className="text-[10px] text-zinc-500">You: #{userRank}</span>
        )}
      </div>
    </div>
  )
}

// ─── AchievementsPanel ───────────────────────────────────────────────────────

function AchievementsPanel({ achievements }: { achievements: Achievement[] }) {
  const unlocked = achievements.filter(a => a.unlocked).length
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Medal className="w-4 h-4 text-yellow-400" />
          <p className="text-sm font-bold text-zinc-100">Achievements</p>
        </div>
        <span className="text-xs font-bold text-zinc-400">
          {unlocked}<span className="text-zinc-600">/{achievements.length}</span>
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {achievements.map(ach => (
          <div
            key={ach.id}
            title={ach.desc}
            className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-center transition-all ${
              ach.unlocked
                ? 'bg-zinc-800/60 border-zinc-700 hover:border-zinc-600'
                : 'bg-zinc-900/30 border-zinc-800/40 opacity-40'
            }`}
          >
            <span className={`text-xl leading-none ${!ach.unlocked ? 'grayscale' : ''}`} style={{ filter: ach.unlocked ? 'none' : 'grayscale(1)' }}>
              {ach.emoji}
            </span>
            <p className="text-[10px] font-bold text-zinc-300 leading-tight">{ach.label}</p>
            {!ach.unlocked && ach.total !== undefined && ach.progress !== undefined && (
              <div className="w-full h-1 bg-zinc-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500/60 rounded-full"
                  style={{ width: `${Math.min((ach.progress / ach.total) * 100, 100)}%` }}
                />
              </div>
            )}
            {ach.unlocked && (
              <span className="text-[9px] text-green-400 font-semibold">Unlocked</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── PreparationToolkit ──────────────────────────────────────────────────────

const TOOLKIT = [
  { href: '/daily',      icon: FlameIcon,   label: 'Daily Challenge', desc: 'One AI/ML question every day',           color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
  { href: '/interview',  icon: BrainCircuit,label: 'AI Simulator',    desc: 'Timed sessions with voice + AI scoring', color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
  { href: '/companies',  icon: Building2,   label: 'Company Prep',    desc: 'Google, Meta, OpenAI & 6 more',          color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20'   },
  { href: '/questions',  icon: Library,     label: 'Question Bank',   desc: 'Browse & study 500+ questions',          color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20'},
  { href: '/job-prep',   icon: Briefcase,   label: 'Job Prep',        desc: 'Paste a JD → get tailored questions',    color: 'text-teal-400',   bg: 'bg-teal-500/10 border-teal-500/20'   },
  { href: '/community',  icon: MessageSquare,label:'Community',        desc: 'Real interview experiences shared',      color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20' },
  { href: '/career',     icon: Map,         label: 'Career Roadmap',  desc: 'Week-by-week AI/ML learning path',       color: 'text-pink-400',   bg: 'bg-pink-500/10 border-pink-500/20'   },
  { href: '/resume',     icon: Target,      label: 'Resume Analyzer', desc: 'ATS score & AI improvements',            color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20'},
  { href: '/paper-explainer',icon: BookOpen,label: 'Paper Explainer', desc: 'Understand any research paper',          color: 'text-cyan-400',   bg: 'bg-cyan-500/10 border-cyan-500/20'   },
]

function PreparationToolkit() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-5">
        <Sparkles className="w-4 h-4 text-orange-400" />
        <p className="text-sm font-bold text-zinc-100">Preparation Toolkit</p>
        <p className="text-xs text-zinc-500 ml-1">— everything in one place</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {TOOLKIT.map(({ href, icon: Icon, label, desc, color, bg }) => (
          <Link
            key={href + label}
            href={href}
            className="group flex flex-col gap-2.5 bg-zinc-800/40 hover:bg-zinc-800/80 border border-zinc-700/50 hover:border-zinc-600 rounded-xl p-3.5 transition-all"
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${bg} shrink-0`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-200 group-hover:text-white transition-colors">{label}</p>
              <p className="text-[10px] text-zinc-600 mt-0.5 leading-tight">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase    = await createClient()
  const adminSb     = getAdminSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch own sessions + all sessions for leaderboard in parallel
  const [{ data: sessions }, { data: allSessions }] = await Promise.all([
    supabase
      .from('user_interview_sessions')
      .select('id, topic, level, question_count, avg_score, grade, created_at')
      .order('created_at', { ascending: false })
      .limit(100),
    adminSb
      .from('user_interview_sessions')
      .select('user_id, avg_score')
      .limit(5000),
  ])

  const s              = (sessions ?? []) as Session[]
  const totalSessions  = s.length
  const overallAvg     = totalSessions ? s.reduce((a, b) => a + b.avg_score, 0) / totalSessions : 0
  const bestScore      = totalSessions ? Math.max(...s.map(x => x.avg_score)) : 0
  const streak         = calcStreak(s)
  const readiness      = calcReadiness(s)
  const emailPrefix    = user.email?.split('@')[0] ?? 'there'
  const lastPracticed  = s[0] ? timeAgo(s[0].created_at) : null

  // Per-topic mastery
  const topicMap: Record<string, number[]> = {}
  s.forEach(sess => { topicMap[sess.topic] = [...(topicMap[sess.topic] ?? []), sess.avg_score] })

  const topicStats = Object.entries(topicMap).map(([topic, scores]) => ({
    topic,
    avg:      scores.reduce((a, b) => a + b, 0) / scores.length,
    sessions: scores.length,
    trend:    scores.length >= 2 ? scores[0] - scores[scores.length - 1] : 0,
  })).sort((a, b) => b.avg - a.avg)

  const bestTopic      = topicStats[0]?.topic ?? null
  const weakTopic      = [...topicStats].sort((a, b) => a.avg - b.avg)[0]?.topic ?? null
  const coveredTopics  = new Set(s.map(x => x.topic))
  const uncoveredTopics = ALL_TOPICS.filter(t => !coveredTopics.has(t))

  // Chart data
  const chartPoints = [...s].reverse().slice(-20).map(sess => ({
    topic: sess.topic, score: sess.avg_score, date: sess.created_at,
  }))

  // ── Leaderboard ──────────────────────────────────────────────────────────────
  const lbMap: Record<string, number[]> = {}
  allSessions?.forEach(row => {
    lbMap[row.user_id] = [...(lbMap[row.user_id] ?? []), row.avg_score]
  })

  const lbEntries: LeaderEntry[] = Object.entries(lbMap)
    .map(([uid, scores]) => ({
      uid,
      avg:      scores.reduce((a, b) => a + b, 0) / scores.length,
      sessions: scores.length,
      isYou:    uid === user.id,
    }))
    .sort((a, b) => b.avg - a.avg)

  const totalUsers = lbEntries.length
  const userRank   = lbEntries.findIndex(e => e.isYou) + 1

  // Top 5, always include current user if outside top 5
  const top5 = lbEntries.slice(0, 5)
  const userInTop5 = top5.some(e => e.isYou)
  const displayedEntries = userInTop5 ? top5 : [
    ...top5.slice(0, 4),
    lbEntries.find(e => e.isYou) ?? { uid: user.id, avg: overallAvg, sessions: totalSessions, isYou: true },
  ]

  // Anonymous display names: first 2 chars of email prefix + ••
  const nameMap: Record<string, string> = {}
  try {
    const { data: { users: authUsers } } = await adminSb.auth.admin.listUsers({ perPage: 1000 })
    authUsers?.forEach(u => {
      const prefix = u.email?.split('@')[0] ?? 'user'
      nameMap[u.id] = u.id === user.id ? emailPrefix : (prefix.slice(0, 2) + '••')
    })
  } catch {
    lbEntries.forEach((e, i) => { nameMap[e.uid] = e.isYou ? emailPrefix : `user${i + 1}` })
  }

  // ── Achievements ─────────────────────────────────────────────────────────────
  const achievements: Achievement[] = [
    { id: 'first',    emoji: '🚀', label: 'First Step',     desc: 'Complete your first session',       unlocked: totalSessions >= 1 },
    { id: 'five',     emoji: '🎯', label: '5-Session Club', desc: 'Complete 5 sessions',               unlocked: totalSessions >= 5,  progress: totalSessions,       total: 5  },
    { id: 'ten',      emoji: '💪', label: 'Dedicated',      desc: 'Complete 10 sessions',              unlocked: totalSessions >= 10, progress: totalSessions,       total: 10 },
    { id: 'score8',   emoji: '⭐', label: 'High Scorer',    desc: 'Score 8.0+ in a session',           unlocked: s.some(x => x.avg_score >= 8) },
    { id: 'score9',   emoji: '💎', label: 'Elite',          desc: 'Score 9.0+ in a session',           unlocked: s.some(x => x.avg_score >= 9) },
    { id: 'topics5',  emoji: '🗺️', label: 'Explorer',       desc: 'Practice 5 different topics',       unlocked: coveredTopics.size >= 5,  progress: coveredTopics.size,  total: 5  },
    { id: 'allTopics',emoji: '🌟', label: 'All-Rounder',    desc: 'Cover all 14 topics',               unlocked: coveredTopics.size >= ALL_TOPICS.length, progress: coveredTopics.size, total: ALL_TOPICS.length },
    { id: 'streak7',  emoji: '🔥', label: 'Week Warrior',   desc: '7-day practice streak',             unlocked: streak >= 7, progress: streak, total: 7 },
    { id: 'ready',    emoji: '🏆', label: 'Interview Ready',desc: 'Reach 80% readiness score',         unlocked: readiness >= 80, progress: readiness, total: 80 },
  ]

  // ── What to do next ───────────────────────────────────────────────────────────
  const nextActions: { label: string; sub: string; href: string; icon: React.ReactNode; accent: string }[] = []

  nextActions.push({
    label: "Today's Daily Challenge",
    sub: 'One question every day — builds streaks and sharp recall',
    href: '/daily',
    icon: <Flame className="w-4 h-4" />,
    accent: 'border-orange-500/30 bg-orange-500/5',
  })

  if (weakTopic && topicMap[weakTopic]) {
    const weakAvg = (topicMap[weakTopic].reduce((a, b) => a + b, 0) / topicMap[weakTopic].length).toFixed(1)
    nextActions.push({
      label: `Improve ${weakTopic}`,
      sub: `Current score: ${weakAvg}/10 — your weakest topic`,
      href: '/interview',
      icon: <BrainCircuit className="w-4 h-4" />,
      accent: 'border-red-500/30 bg-red-500/5',
    })
  } else if (uncoveredTopics.length > 0) {
    nextActions.push({
      label: `Try ${uncoveredTopics[0]}`,
      sub: 'You haven\'t practiced this yet — needed for full readiness',
      href: '/interview',
      icon: <BrainCircuit className="w-4 h-4" />,
      accent: 'border-orange-500/30 bg-orange-500/5',
    })
  }

  nextActions.push({
    label: 'Practice for a specific company',
    sub: 'Google, Meta, OpenAI, Anthropic & more',
    href: '/companies',
    icon: <Building2 className="w-4 h-4" />,
    accent: 'border-blue-500/30 bg-blue-500/5',
  })

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-zinc-950 pt-20 pb-16">
      <div className="max-w-5xl mx-auto px-4">

        {/* Header */}
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
              {lastPracticed ? `Last practiced: ${lastPracticed}` : 'Welcome — start your first session below'}
            </p>
          </div>
          <form action={logout}>
            <button type="submit" className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-lg transition-colors">
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </button>
          </form>
        </div>

        <div className="flex flex-col gap-5">

          {/* ── Top 3-column: Readiness | Stats | Leaderboard ── */}
          {totalSessions === 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-4">
              {/* Empty state */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 text-center">
                <div className="w-16 h-16 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <BrainCircuit className="w-7 h-7 text-orange-400" />
                </div>
                <h2 className="text-lg font-bold text-zinc-100 mb-2">Start your first session</h2>
                <p className="text-zinc-500 text-sm mb-6 max-w-sm mx-auto">
                  Complete one interview to unlock your readiness score, topic mastery chart, and full progress tracking.
                </p>
                <Link href="/interview" className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/20">
                  Start Interview Practice <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              {/* Leaderboard even for new users */}
              <LeaderboardCard entries={displayedEntries} nameMap={nameMap} userRank={userRank} totalUsers={totalUsers} />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr_220px] gap-4">

              {/* Col 1: Readiness arc */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center gap-2">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Interview Readiness</p>
                <ReadinessArc score={readiness} />
                <p className="text-xs text-zinc-600 text-center max-w-[140px]">
                  {coveredTopics.size}/{ALL_TOPICS.length} topics covered
                </p>
              </div>

              {/* Col 2: 4 key stats */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: <Trophy className="w-4 h-4" />,       label: 'Sessions',      value: String(totalSessions),                 sub: 'total completed',                                 color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
                  { icon: <Target className="w-4 h-4" />,       label: 'Avg Score',     value: `${overallAvg.toFixed(1)}/10`,         sub: 'all sessions',                                    color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20'   },
                  { icon: <Star className="w-4 h-4" />,         label: 'Personal Best', value: `${bestScore.toFixed(1)}/10`,          sub: 'highest avg',                                     color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20' },
                  { icon: <Flame className="w-4 h-4" />,        label: 'Streak',        value: streak > 0 ? `${streak} day${streak > 1 ? 's' : ''}` : '—', sub: streak > 0 ? 'keep it up!' : 'practice today', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
                  { icon: <CheckCircle2 className="w-4 h-4" />, label: 'Best Topic',    value: bestTopic ?? '—',                      sub: 'highest avg score',                               color: 'text-teal-400',   bg: 'bg-teal-500/10 border-teal-500/20'   },
                  { icon: <AlertTriangle className="w-4 h-4" />,label: 'Needs Work',    value: weakTopic ?? '—',                      sub: 'lowest avg score',                                color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20'     },
                ].map((stat) => (
                  <div key={stat.label} className={`rounded-2xl border p-4 flex flex-col gap-1 ${stat.bg}`}>
                    <div className={stat.color}>{stat.icon}</div>
                    <p className="text-xs text-zinc-500">{stat.label}</p>
                    <p className="text-sm font-bold text-zinc-100 truncate">{stat.value}</p>
                    <p className="text-[10px] text-zinc-600">{stat.sub}</p>
                  </div>
                ))}
              </div>

              {/* Col 3: Leaderboard */}
              <LeaderboardCard entries={displayedEntries} nameMap={nameMap} userRank={userRank} totalUsers={totalUsers} />
            </div>
          )}

          {/* ── Daily Challenge Strip (client — reads localStorage) ── */}
          <DailyChallengeStrip />

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
              <div className="flex items-center gap-4 mt-3 flex-wrap">
                {[['≥8','#4ade80','Strong'],['≥6','#60a5fa','Good'],['≥4','#facc15','Fair'],['<4','#f87171','Weak']].map(([r, c, l]) => (
                  <div key={r} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
                    <span className="text-[10px] text-zinc-500">{r} {l}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Topic Mastery + Achievements side-by-side ── */}
          {totalSessions > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">

              {/* Topic Mastery */}
              {topicStats.length > 0 && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className="text-sm font-bold text-zinc-100">Topic Mastery</p>
                      <p className="text-xs text-zinc-500">{topicStats.length} practiced · {uncoveredTopics.length} remaining</p>
                    </div>
                    <BookOpen className="w-4 h-4 text-zinc-600" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {topicStats.map(({ topic, avg, sessions: sc, trend }) => {
                      const bar   = TOPIC_BAR[topic] ?? 'bg-zinc-500'
                      const badge = TOPIC_COLORS[topic] ?? 'bg-zinc-800 text-zinc-300 border-zinc-700'
                      return (
                        <div key={topic} className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-3.5">
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${badge}`}>{topic}</span>
                            <div className="flex items-center gap-2">
                              {trend > 0.5  && <span className="text-[10px] text-green-400 font-semibold">↑ improving</span>}
                              {trend < -0.5 && <span className="text-[10px] text-red-400 font-semibold">↓ declining</span>}
                              <span className={`text-sm font-extrabold ${scoreBarColor(avg).replace('bg-','text-').replace('-500','-400')}`}>{avg.toFixed(1)}</span>
                            </div>
                          </div>
                          <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden mb-1.5">
                            <div className={`h-full ${bar} opacity-80 rounded-full`} style={{ width: `${(avg / 10) * 100}%` }} />
                          </div>
                          <p className="text-[10px] text-zinc-600">{sc} session{sc > 1 ? 's' : ''}</p>
                        </div>
                      )
                    })}
                  </div>
                  {uncoveredTopics.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-zinc-800">
                      <p className="text-xs text-zinc-600 mb-2">Not yet practiced:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {uncoveredTopics.map(t => (
                          <span key={t} className="text-[10px] font-medium text-zinc-600 bg-zinc-800/50 border border-zinc-700/50 px-2 py-0.5 rounded-full">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Achievements */}
              <AchievementsPanel achievements={achievements} />
            </div>
          )}

          {/* ── Recent Sessions ── */}
          {totalSessions > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-4">Recent Sessions</p>
              <div className="flex flex-col gap-2">
                {s.slice(0, 6).map((sess) => (
                  <div key={sess.id} className={`flex items-center gap-3 p-3 rounded-xl border ${gradeBg(sess.grade)}`}>
                    <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${gradeBg(sess.grade)}`}>
                      <span className={`text-sm font-extrabold ${gradeColor(sess.grade)}`}>{sess.grade}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full border ${TOPIC_COLORS[sess.topic] ?? 'bg-zinc-800 text-zinc-300 border-zinc-700'}`}>{sess.topic}</span>
                        <span className="text-[10px] text-zinc-500">{sess.level} · {sess.question_count}Q</span>
                      </div>
                      <p className="text-[10px] text-zinc-600 mt-0.5">{formatDate(sess.created_at)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-base font-extrabold ${gradeColor(sess.grade)}`}>{sess.avg_score.toFixed(1)}</p>
                      <p className="text-[10px] text-zinc-600">/10</p>
                    </div>
                  </div>
                ))}
              </div>
              {s.length > 6 && <p className="text-xs text-zinc-600 text-center mt-3">{s.length - 6} more sessions</p>}
            </div>
          )}

          {/* ── What To Do Next ── */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-4 h-4 text-orange-400" />
              <p className="text-sm font-bold text-zinc-100">What To Do Next</p>
              {totalSessions > 0 && <span className="text-xs text-zinc-500 ml-1">— based on your progress</span>}
            </div>
            <div className="flex flex-col gap-2.5">
              {nextActions.slice(0, 3).map((action) => (
                <Link
                  key={action.href + action.label}
                  href={action.href}
                  className={`group flex items-center gap-4 p-4 rounded-xl border transition-all hover:brightness-110 ${action.accent}`}
                >
                  <div className="w-8 h-8 bg-zinc-800/60 rounded-lg flex items-center justify-center text-zinc-400 group-hover:text-zinc-200 shrink-0 transition-colors">
                    {action.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-100">{action.label}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{action.sub}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 group-hover:translate-x-0.5 transition-all shrink-0" />
                </Link>
              ))}
            </div>
          </div>

          {/* ── Preparation Toolkit ── */}
          <PreparationToolkit />

          {/* ── Bottom CTA ── */}
          <div className="flex gap-3">
            <Link href="/interview" className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/20">
              <BrainCircuit className="w-4 h-4" /> New Practice Session
            </Link>
            <Link href="/questions" className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-sm font-semibold px-5 py-3.5 rounded-xl transition-colors">
              <Library className="w-4 h-4" /> Browse Questions
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}
