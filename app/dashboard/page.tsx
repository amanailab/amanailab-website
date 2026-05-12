import { createClient } from '@/lib/supabase/server'
import { getAdminSupabase } from '@/lib/admin'
import { redirect } from 'next/navigation'
import { logout } from '@/app/actions/auth'
import {
  Trophy, BrainCircuit, TrendingUp, LogOut,
  Target, Flame, Star, AlertTriangle, ArrowRight,
  CheckCircle2, BookOpen, Building2, MessageSquare,
  Briefcase, Map, Library, Sparkles, Medal,
  Flame as FlameIcon, Users, Code2,
} from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'
import ScoreLineChart from '@/components/dashboard/ScoreLineChart'
import DailyChallengeStrip from '@/components/dashboard/DailyChallengeStrip'
import XPCard from '@/components/dashboard/XPCard'
import ActivityHeatmap from '@/components/dashboard/ActivityHeatmap'
import CompanyReadiness from '@/components/dashboard/CompanyReadiness'
import InterviewCountdown from '@/components/dashboard/InterviewCountdown'
import AchievementAlert from '@/components/dashboard/AchievementAlert'

export const metadata: Metadata = { title: 'My Dashboard' }

// ─── Types ────────────────────────────────────────────────────────────────────

interface Session {
  id: string; topic: string; level: string
  question_count: number; avg_score: number; grade: string; created_at: string
}
interface LeaderEntry { uid: string; avg: number; sessions: number; isYou: boolean }
interface Achievement {
  id: string; emoji: string; label: string; desc: string
  unlocked: boolean; progress?: number; total?: number
}
interface CodeStats {
  solved: number; easy_solved: number; medium_solved: number; hard_solved: number
  easy_total: number; medium_total: number; hard_total: number; total_problems: number
  recent: { title: string; slug: string; difficulty: string; status: string }[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_TOPICS = [
  'LLM','RAG','Agents','Fine-Tuning','MLOps','Transformers',
  'System Design','Python','Vector DB','Computer Vision','NLP',
  'Statistics','SQL & Data','Behavioral',
]

const TOPIC_COLORS: Record<string, string> = {
  LLM:'bg-blue-500/20 text-blue-300 border-blue-500/30', RAG:'bg-violet-500/20 text-violet-300 border-violet-500/30',
  Agents:'bg-orange-500/20 text-orange-300 border-orange-500/30', 'Fine-Tuning':'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  MLOps:'bg-green-500/20 text-green-300 border-green-500/30', Transformers:'bg-teal-500/20 text-teal-300 border-teal-500/30',
  'System Design':'bg-red-500/20 text-red-300 border-red-500/30', Python:'bg-lime-500/20 text-lime-300 border-lime-500/30',
  'Vector DB':'bg-pink-500/20 text-pink-300 border-pink-500/30', 'Computer Vision':'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  NLP:'bg-purple-500/20 text-purple-300 border-purple-500/30', Statistics:'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'SQL & Data':'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', Behavioral:'bg-rose-500/20 text-rose-300 border-rose-500/30',
}
const TOPIC_BAR: Record<string, string> = {
  LLM:'bg-blue-500', RAG:'bg-violet-500', Agents:'bg-orange-500', 'Fine-Tuning':'bg-yellow-500',
  MLOps:'bg-green-500', Transformers:'bg-teal-500', 'System Design':'bg-red-500', Python:'bg-lime-500',
  'Vector DB':'bg-pink-500', 'Computer Vision':'bg-cyan-500', NLP:'bg-purple-500', Statistics:'bg-amber-500',
  'SQL & Data':'bg-emerald-500', Behavioral:'bg-rose-500',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
  if (days === 0) return 'Today'; if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`; if (days < 30) return `${Math.floor(days / 7)}w ago`
  return formatDate(iso)
}
function calcStreak(sessions: Session[]): number {
  if (!sessions.length) return 0
  const dates = [...new Set(sessions.map(s => s.created_at.split('T')[0]))].sort((a, b) => b.localeCompare(a))
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  if (dates[0] !== today && dates[0] !== yesterday) return 0
  let streak = 1
  for (let i = 1; i < dates.length; i++) {
    if ((new Date(dates[i - 1]).getTime() - new Date(dates[i]).getTime()) / 86400000 <= 1.5) streak++
    else break
  }
  return streak
}
function calcReadiness(sessions: Session[]): number {
  if (!sessions.length) return 0
  const covered = new Set(sessions.map(s => s.topic)).size
  const avg = sessions.reduce((a, b) => a + b.avg_score, 0) / sessions.length
  return Math.min(Math.round((covered / ALL_TOPICS.length) * 30 + (avg / 10) * 50 + Math.min(sessions.length / 10, 1) * 20), 100)
}
function readinessLabel(r: number) {
  if (r >= 80) return { label: 'Interview Ready', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' }
  if (r >= 60) return { label: 'Almost Ready', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' }
  if (r >= 40) return { label: 'Developing', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' }
  return { label: 'Just Starting', color: 'text-zinc-400', bg: 'bg-zinc-800 border-zinc-700' }
}

async function getCodeStats(userId: string, sb: ReturnType<typeof getAdminSupabase>): Promise<CodeStats> {
  const defaults: CodeStats = { solved: 0, easy_solved: 0, medium_solved: 0, hard_solved: 0, easy_total: 9, medium_total: 8, hard_total: 3, total_problems: 20, recent: [] }
  try {
    const [{ data: subs }, { data: problems }] = await Promise.all([
      sb.from('code_submissions').select('problem_id, status, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(100),
      sb.from('code_problems').select('id, title, slug, difficulty').order('order_index', { ascending: true }),
    ])
    if (!subs || !problems) return defaults
    const pMap = Object.fromEntries(problems.map(p => [p.id, p]))
    const accepted = new Set(subs.filter(s => s.status === 'Accepted').map(s => s.problem_id))
    let easy = 0, medium = 0, hard = 0
    for (const id of accepted) {
      const p = pMap[id]; if (!p) continue
      if (p.difficulty === 'Easy') easy++
      else if (p.difficulty === 'Medium') medium++
      else if (p.difficulty === 'Hard') hard++
    }
    const seen = new Set<string>(); const recent = []
    for (const sub of subs) {
      if (seen.has(sub.problem_id)) continue; seen.add(sub.problem_id)
      const p = pMap[sub.problem_id]; if (!p) continue
      recent.push({ title: p.title, slug: p.slug, difficulty: p.difficulty, status: sub.status })
      if (recent.length >= 4) break
    }
    return {
      solved: accepted.size, easy_solved: easy, medium_solved: medium, hard_solved: hard,
      easy_total: problems.filter(p => p.difficulty === 'Easy').length || 9,
      medium_total: problems.filter(p => p.difficulty === 'Medium').length || 8,
      hard_total: problems.filter(p => p.difficulty === 'Hard').length || 3,
      total_problems: problems.length || 20, recent,
    }
  } catch { return defaults }
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ReadinessArc({ score }: { score: number }) {
  const circ = Math.PI * 64; const dash = circ * (score / 100)
  const color = score >= 80 ? '#4ade80' : score >= 60 ? '#60a5fa' : score >= 40 ? '#facc15' : '#71717a'
  const label = readinessLabel(score)
  return (
    <div className="flex flex-col items-center">
      <svg
        width="160" height="90" viewBox="0 0 160 90"
        role="img"
        aria-label={`Interview Readiness: ${score} out of 100 — ${label.label}`}
      >
        <path d="M 12 80 A 68 68 0 0 1 148 80" fill="none" stroke="#27272a" strokeWidth="10" strokeLinecap="round" />
        <path d="M 12 80 A 68 68 0 0 1 148 80" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${dash} ${circ}`} />
        <text x="80" y="72" textAnchor="middle" fill={color} fontSize="26" fontWeight="800">{score}</text>
        <text x="80" y="86" textAnchor="middle" fill="#52525b" fontSize="9">/ 100</text>
      </svg>
      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border mt-1 ${label.bg} ${label.color}`}>{label.label}</span>
    </div>
  )
}

function SolvedRing({ solved, total }: { solved: number; total: number }) {
  const r = 34; const circ = 2 * Math.PI * r
  const dash = total > 0 ? circ * (solved / total) : 0
  return (
    <div className="flex flex-col items-center">
      <svg
        width="84" height="84" viewBox="0 0 84 84"
        role="img"
        aria-label={`${solved} of ${total} problems solved`}
      >
        <circle cx="42" cy="42" r={r} fill="none" stroke="#27272a" strokeWidth="7" />
        <circle cx="42" cy="42" r={r} fill="none" stroke="#f97316" strokeWidth="7"
          strokeLinecap="round" strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ / 4}
          style={{ transition: 'stroke-dasharray 0.8s ease' }} />
        <text x="42" y="38" textAnchor="middle" fill="#f4f4f5" fontSize="16" fontWeight="800">{solved}</text>
        <text x="42" y="53" textAnchor="middle" fill="#52525b" fontSize="10">/{total}</text>
      </svg>
      <p className="text-[10px] text-zinc-600 mt-1">problems solved</p>
    </div>
  )
}

// ─── Leaderboard sidebar card ─────────────────────────────────────────────────

function LeaderboardCard({ entries, nameMap, userRank, totalUsers }: {
  entries: LeaderEntry[]; nameMap: Record<string, string>; userRank: number; totalUsers: number
}) {
  const maxAvg = entries[0]?.avg ?? 10
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-400" />
          <p className="text-sm font-bold text-zinc-100">Leaderboard</p>
        </div>
        {userRank > 0 && (
          <span className="text-xs font-extrabold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2.5 py-1 rounded-full">
            #{userRank}
          </span>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="text-xs text-zinc-600 text-center py-4">Practice to appear here</p>
      ) : (
        <div className="flex flex-col gap-2">
          {entries.map((e, i) => {
            const barPct = maxAvg > 0 ? (e.avg / maxAvg) * 100 : 0
            const rankColors = ['text-yellow-400', 'text-zinc-300', 'text-amber-600']
            return (
              <div key={e.uid} className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all ${e.isYou ? 'bg-orange-500/10 border border-orange-500/25' : 'bg-zinc-800/30'}`}>
                <span className={`text-xs font-extrabold w-4 shrink-0 ${rankColors[i] ?? 'text-zinc-600'}`}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-semibold truncate ${e.isYou ? 'text-orange-300' : 'text-zinc-300'}`}>
                      {e.isYou ? 'You' : (nameMap[e.uid] ?? 'user••')}
                    </span>
                    <span className={`text-xs font-extrabold shrink-0 ml-2 ${scoreTextColor(e.avg)}`}>{e.avg.toFixed(1)}</span>
                  </div>
                  <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${e.isYou ? 'bg-orange-500' : scoreBarColor(e.avg)}`} style={{ width: `${barPct}%` }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="flex items-center gap-1.5 mt-4 pt-4 border-t border-zinc-800">
        <Users className="w-3 h-3 text-zinc-600" />
        <span className="text-[10px] text-zinc-600">{totalUsers} total users · ranked by avg score</span>
      </div>
    </div>
  )
}

// ─── Code Lab sidebar card ────────────────────────────────────────────────────

function CodeLabCard({ stats }: { stats: CodeStats }) {
  const DIFF_COLOR = { Easy: 'text-green-400', Medium: 'text-yellow-400', Hard: 'text-red-400' } as const
  const DIFF_BAR = { Easy: 'bg-green-500', Medium: 'bg-yellow-500', Hard: 'bg-red-500' } as const

  const diffRows = [
    { label: 'Easy' as const,   solved: stats.easy_solved,   total: stats.easy_total },
    { label: 'Medium' as const, solved: stats.medium_solved, total: stats.medium_total },
    { label: 'Hard' as const,   solved: stats.hard_solved,   total: stats.hard_total },
  ]

  return (
    <div className="bg-zinc-900 border border-orange-500/20 rounded-2xl p-5 ring-1 ring-orange-500/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-orange-500/10 border border-orange-500/20 rounded-lg flex items-center justify-center">
            <Code2 className="w-3.5 h-3.5 text-orange-400" />
          </div>
          <p className="text-sm font-bold text-zinc-100">Code Lab</p>
        </div>
        <Link href="/code-lab" className="text-[10px] text-orange-400 hover:text-orange-300 transition-colors font-semibold">
          View All →
        </Link>
      </div>

      {/* Progress ring + difficulty bars */}
      <div className="flex items-center gap-4 mb-4">
        <SolvedRing solved={stats.solved} total={stats.total_problems} />
        <div className="flex-1 flex flex-col gap-2">
          {diffRows.map(({ label, solved, total }) => (
            <div key={label}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-bold ${DIFF_COLOR[label]}`}>{label}</span>
                <span className="text-[10px] text-zinc-500">{solved}/{total}</span>
              </div>
              <div
                className="h-1.5 bg-zinc-700 rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={solved}
                aria-valuemin={0}
                aria-valuemax={total}
                aria-label={`${label} problems: ${solved} of ${total} solved`}
              >
                <div className={`h-full rounded-full ${DIFF_BAR[label]} opacity-80`}
                  style={{ width: total > 0 ? `${(solved / total) * 100}%` : '0%' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      {stats.recent.length > 0 && (
        <div className="border-t border-zinc-800 pt-3">
          <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-2">Recent</p>
          <div className="flex flex-col gap-1.5">
            {stats.recent.map((r, i) => (
              <Link key={i} href={`/code-lab/${r.slug}`}
                className="flex items-center gap-2 group">
                {r.status === 'Accepted'
                  ? <CheckCircle2 className="w-3 h-3 text-green-400 shrink-0" />
                  : <div className="w-3 h-3 rounded-full border border-red-500/50 bg-red-500/10 shrink-0" />}
                <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors flex-1 truncate">{r.title}</span>
                <span className={`text-[9px] font-semibold shrink-0 ${DIFF_COLOR[r.difficulty as keyof typeof DIFF_COLOR] ?? 'text-zinc-500'}`}>{r.difficulty}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <Link href="/code-lab"
        className="mt-4 flex items-center justify-center gap-2 w-full bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/25 text-orange-400 text-xs font-semibold py-2 rounded-xl transition-all">
        {stats.solved === 0 ? 'Start Solving Problems' : `Solve More — ${stats.total_problems - stats.solved} left`}
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  )
}

// ─── Achievements panel ──────────────────────────────────────────────────────

function AchievementsPanel({ achievements }: { achievements: Achievement[] }) {
  const unlocked = achievements.filter(a => a.unlocked).length
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Medal className="w-4 h-4 text-yellow-400" />
          <p className="text-sm font-bold text-zinc-100">Achievements</p>
        </div>
        <span className="text-xs font-bold text-zinc-400">{unlocked}<span className="text-zinc-600">/{achievements.length}</span></span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {achievements.map(ach => (
          <div key={ach.id} title={ach.desc}
            className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-center transition-all ${ach.unlocked ? 'bg-zinc-800/60 border-zinc-700 hover:border-zinc-600' : 'bg-zinc-900/30 border-zinc-800/40 opacity-40'}`}>
            <span className="text-xl leading-none">{ach.emoji}</span>
            <p className="text-[10px] font-bold text-zinc-300 leading-tight">{ach.label}</p>
            {!ach.unlocked && ach.total !== undefined && ach.progress !== undefined && (
              <div
                className="w-full h-1 bg-zinc-700 rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={ach.progress}
                aria-valuemin={0}
                aria-valuemax={ach.total}
                aria-label={`${ach.label}: ${ach.progress} of ${ach.total}`}
              >
                <div className="h-full bg-orange-500/60 rounded-full" style={{ width: `${Math.min((ach.progress / ach.total) * 100, 100)}%` }} />
              </div>
            )}
            {ach.unlocked && <span className="text-[9px] text-green-400 font-semibold">Unlocked</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Preparation Toolkit ─────────────────────────────────────────────────────

const TOOLKIT = [
  { href: '/daily',         icon: FlameIcon,    label: 'Daily Challenge', desc: 'One question every day',           color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
  { href: '/interview?tab=simulator', icon: BrainCircuit, label: 'AI Simulator', desc: 'Timed sessions with AI scoring', color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
  { href: '/companies',     icon: Building2,    label: 'Company Prep',    desc: 'Google, Meta, OpenAI & more',      color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20'   },
  { href: '/questions',     icon: Library,      label: 'Question Bank',   desc: 'Browse 500+ questions',            color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20'},
  { href: '/job-prep',      icon: Briefcase,    label: 'Job Prep',        desc: 'Paste JD → tailored questions',    color: 'text-teal-400',   bg: 'bg-teal-500/10 border-teal-500/20'   },
  { href: '/community',     icon: MessageSquare,label: 'Community',       desc: 'Real interview experiences',       color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20' },
  { href: '/career',        icon: Map,          label: 'Career Roadmap',  desc: 'Week-by-week AI/ML path',          color: 'text-pink-400',   bg: 'bg-pink-500/10 border-pink-500/20'   },
  { href: '/resume',        icon: Target,       label: 'Resume Analyzer', desc: 'ATS score & improvements',         color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20'},
  { href: '/paper-explainer',icon: BookOpen,    label: 'Paper Explainer', desc: 'Understand any research paper',    color: 'text-cyan-400',   bg: 'bg-cyan-500/10 border-cyan-500/20'   },
]

function PreparationToolkit() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-5">
        <Sparkles className="w-4 h-4 text-orange-400" />
        <p className="text-sm font-bold text-zinc-100">Preparation Toolkit</p>
        <p className="text-xs text-zinc-500 ml-1">— everything in one place</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {TOOLKIT.map(({ href, icon: Icon, label, desc, color, bg }) => (
          <Link key={href + label} href={href}
            className="group flex flex-col gap-2.5 bg-zinc-800/40 hover:bg-zinc-800/80 border border-zinc-700/50 hover:border-zinc-600 rounded-xl p-3.5 transition-all">
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
  const supabase  = await createClient()
  const adminSb   = getAdminSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch all data in parallel with an 8-second safety timeout per query
  const deadlineMs = 8000
  function raceWithTimeout<T>(p: Promise<T>, fallback: T): Promise<T> {
    return Promise.race([p, new Promise<T>(r => setTimeout(() => r(fallback), deadlineMs))])
  }

  const [sessions, allSessions, codeStats] = await Promise.all([
    raceWithTimeout(
      Promise.resolve(supabase.from('user_interview_sessions')
        .select('id,topic,level,question_count,avg_score,grade,created_at')
        .order('created_at', { ascending: false })
        .limit(100)).then(r => r.data),
      null as Session[] | null,
    ),
    raceWithTimeout(
      Promise.resolve(adminSb.from('user_interview_sessions')
        .select('user_id,avg_score')
        .limit(5000)).then(r => r.data),
      null as { user_id: string; avg_score: number }[] | null,
    ),
    raceWithTimeout(getCodeStats(user.id, adminSb), { solved: 0, easy_solved: 0, medium_solved: 0, hard_solved: 0, easy_total: 9, medium_total: 8, hard_total: 3, total_problems: 20, recent: [] } as CodeStats),
  ])

  const s             = (sessions ?? []) as Session[]
  const totalSessions = s.length
  const overallAvg    = totalSessions ? s.reduce((a, b) => a + b.avg_score, 0) / totalSessions : 0
  const bestScore     = totalSessions ? Math.max(...s.map(x => x.avg_score)) : 0
  const streak        = calcStreak(s)
  const readiness     = calcReadiness(s)
  // Prefer the display name set in profile; fall back to email prefix
  const emailPrefix   = (user.user_metadata?.display_name as string | undefined)?.trim()
                     || user.email?.split('@')[0]
                     || 'there'
  const lastPracticed = s[0] ? timeAgo(s[0].created_at) : null

  // Topic mastery
  const topicMap: Record<string, number[]> = {}
  s.forEach(sess => { topicMap[sess.topic] = [...(topicMap[sess.topic] ?? []), sess.avg_score] })
  const topicStats = Object.entries(topicMap).map(([topic, scores]) => ({
    topic, avg: scores.reduce((a, b) => a + b, 0) / scores.length, sessions: scores.length,
    trend: scores.length >= 2 ? scores[0] - scores[scores.length - 1] : 0,
  })).sort((a, b) => b.avg - a.avg)

  const bestTopic     = topicStats[0]?.topic ?? null
  const weakTopic     = [...topicStats].sort((a, b) => a.avg - b.avg)[0]?.topic ?? null
  const coveredTopics = new Set(s.map(x => x.topic))
  const uncoveredTopics = ALL_TOPICS.filter(t => !coveredTopics.has(t))
  const chartPoints   = [...s].reverse().slice(-20).map(sess => ({ topic: sess.topic, score: sess.avg_score, date: sess.created_at }))

  // Leaderboard
  const lbMap: Record<string, number[]> = {}
  allSessions?.forEach(row => { lbMap[row.user_id] = [...(lbMap[row.user_id] ?? []), row.avg_score] })
  const lbEntries: LeaderEntry[] = Object.entries(lbMap)
    .map(([uid, scores]) => ({ uid, avg: scores.reduce((a, b) => a + b, 0) / scores.length, sessions: scores.length, isYou: uid === user.id }))
    .sort((a, b) => b.avg - a.avg)
  const totalUsers  = lbEntries.length
  const userRank    = lbEntries.findIndex(e => e.isYou) + 1
  const top5        = lbEntries.slice(0, 5)
  const userInTop5  = top5.some(e => e.isYou)
  const displayedEntries = userInTop5 ? top5 : [
    ...top5.slice(0, 4),
    lbEntries.find(e => e.isYou) ?? { uid: user.id, avg: overallAvg, sessions: totalSessions, isYou: true },
  ]

  // Anonymous display names — other users get a rank-based alias, never partial email
  const nameMap: Record<string, string> = {}
  lbEntries.forEach((e, i) => {
    nameMap[e.uid] = e.isYou ? emailPrefix : `user_${i + 1}`
  })

  // Achievements
  const achievements: Achievement[] = [
    { id: 'first',     emoji: '🚀', label: 'First Step',     desc: 'Complete your first session',      unlocked: totalSessions >= 1 },
    { id: 'five',      emoji: '🎯', label: '5-Session Club', desc: 'Complete 5 sessions',              unlocked: totalSessions >= 5,  progress: totalSessions,      total: 5  },
    { id: 'ten',       emoji: '💪', label: 'Dedicated',      desc: 'Complete 10 sessions',             unlocked: totalSessions >= 10, progress: totalSessions,      total: 10 },
    { id: 'score8',    emoji: '⭐', label: 'High Scorer',    desc: 'Score 8.0+ in a session',          unlocked: s.some(x => x.avg_score >= 8) },
    { id: 'score9',    emoji: '💎', label: 'Elite',          desc: 'Score 9.0+ in a session',          unlocked: s.some(x => x.avg_score >= 9) },
    { id: 'topics5',   emoji: '🗺️', label: 'Explorer',       desc: 'Practice 5 different topics',      unlocked: coveredTopics.size >= 5,  progress: coveredTopics.size, total: 5  },
    { id: 'allTopics', emoji: '🌟', label: 'All-Rounder',    desc: 'Cover all 14 topics',              unlocked: coveredTopics.size >= ALL_TOPICS.length, progress: coveredTopics.size, total: ALL_TOPICS.length },
    { id: 'streak7',   emoji: '🔥', label: 'Week Warrior',   desc: '7-day practice streak',            unlocked: streak >= 7, progress: streak, total: 7 },
    { id: 'ready',     emoji: '🏆', label: 'Interview Ready',desc: 'Reach 80% readiness score',        unlocked: readiness >= 80, progress: readiness, total: 80 },
  ]

  // What to do next
  const nextActions: { label: string; sub: string; href: string; icon: React.ReactNode; accent: string }[] = []
  nextActions.push({ label: "Today's Daily Challenge", sub: 'One question every day — builds streaks', href: '/daily', icon: <Flame className="w-4 h-4" />, accent: 'border-orange-500/30 bg-orange-500/5' })
  if (weakTopic && topicMap[weakTopic]) {
    const weakAvg = (topicMap[weakTopic].reduce((a, b) => a + b, 0) / topicMap[weakTopic].length).toFixed(1)
    nextActions.push({ label: `Improve ${weakTopic}`, sub: `Current score: ${weakAvg}/10 — your weakest topic`, href: '/interview?tab=simulator', icon: <BrainCircuit className="w-4 h-4" />, accent: 'border-red-500/30 bg-red-500/5' })
  } else if (uncoveredTopics.length > 0) {
    nextActions.push({ label: `Try ${uncoveredTopics[0]}`, sub: "Haven't practiced this yet", href: '/interview?tab=simulator', icon: <BrainCircuit className="w-4 h-4" />, accent: 'border-orange-500/30 bg-orange-500/5' })
  }
  nextActions.push({ label: 'Practice for a specific company', sub: 'Google, Meta, OpenAI & more', href: '/companies', icon: <Building2 className="w-4 h-4" />, accent: 'border-blue-500/30 bg-blue-500/5' })

  return (
    <div className="min-h-screen bg-zinc-950 pt-20 pb-16">
      <div className="max-w-6xl mx-auto px-4">

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
            <p className="text-sm text-zinc-500">{lastPracticed ? `Last practiced: ${lastPracticed}` : 'Welcome — start your first session below'}</p>
          </div>
          <form action={logout}>
            <button type="submit" className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-lg transition-colors">
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </button>
          </form>
        </div>

        {/* ── 2-column layout ── */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ──────── LEFT: main content ──────── */}
          <div className="flex-1 min-w-0 flex flex-col gap-5">

            {/* Interview countdown — always visible for all users */}
            <InterviewCountdown
              weakTopics={topicStats.slice(-3).map(t => t.topic)}
              strongTopics={topicStats.slice(0, 3).map(t => t.topic)}
            />

            {totalSessions === 0 ? (
              /* ── Better empty state with quick start cards ── */
              <div className="flex flex-col gap-4">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center">
                  <div className="w-14 h-14 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <BrainCircuit className="w-6 h-6 text-orange-400" />
                  </div>
                  <h2 className="text-base font-bold text-zinc-100 mb-1">Complete your first session</h2>
                  <p className="text-zinc-500 text-xs mb-0">Practice any topic below to unlock your readiness score, progress chart, and leaderboard rank.</p>
                </div>

                {/* Quick start cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { href: '/interview?tab=simulator', icon: BrainCircuit, label: 'AI Interview', desc: 'Timed mock with scoring', color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20', cta: 'Start Session' },
                    { href: '/daily',                   icon: FlameIcon,    label: 'Daily Challenge', desc: "Today's AI/ML question", color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', cta: 'Answer Now' },
                    { href: '/code-lab',                icon: Code2,        label: 'Code Lab',        desc: 'Solve coding problems',  color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20',  cta: 'View Problems' },
                  ].map(({ href, icon: Icon, label, desc, color, bg, cta }) => (
                    <Link key={href} href={href}
                      className="group flex flex-col gap-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-2xl p-5 transition-all hover:-translate-y-0.5">
                      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${bg}`}>
                        <Icon className={`w-5 h-5 ${color}`} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-zinc-100">{label}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">{desc}</p>
                      </div>
                      <span className={`text-xs font-semibold ${color} flex items-center gap-1`}>
                        {cta} <ArrowRight className="w-3 h-3" />
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* Readiness + 4 stats */}
                <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4">
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col items-center justify-center gap-2">
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Interview Readiness</p>
                    <ReadinessArc score={readiness} />
                    <p className="text-xs text-zinc-600">{coveredTopics.size}/{ALL_TOPICS.length} topics covered</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: <Trophy className="w-4 h-4" />,        label: 'Sessions',      value: String(totalSessions),               sub: 'completed',                                    color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
                      { icon: <Target className="w-4 h-4" />,        label: 'Avg Score',     value: `${overallAvg.toFixed(1)}/10`,       sub: 'all sessions',                                 color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20'   },
                      { icon: <Star className="w-4 h-4" />,          label: 'Personal Best', value: `${bestScore.toFixed(1)}/10`,        sub: 'highest avg',                                  color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20' },
                      { icon: <Flame className="w-4 h-4" />,         label: 'Streak',        value: streak > 0 ? `${streak}d` : '—',    sub: streak > 0 ? 'keep it up!' : 'practice today',  color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20'},
                      { icon: <CheckCircle2 className="w-4 h-4" />,  label: 'Best Topic',    value: bestTopic ?? '—',                   sub: 'highest avg',                                  color: 'text-teal-400',   bg: 'bg-teal-500/10 border-teal-500/20'   },
                      { icon: <AlertTriangle className="w-4 h-4" />, label: 'Needs Work',    value: weakTopic ?? '—',                   sub: 'lowest avg',                                   color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20'     },
                    ].map((stat) => (
                      <div key={stat.label} className={`rounded-2xl border p-4 flex flex-col gap-1 ${stat.bg}`}>
                        <div className={stat.color}>{stat.icon}</div>
                        <p className="text-xs text-zinc-500">{stat.label}</p>
                        <p className="text-sm font-bold text-zinc-100 truncate">{stat.value}</p>
                        <p className="text-[10px] text-zinc-600">{stat.sub}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Daily challenge strip */}
                <DailyChallengeStrip />

                {/* Score trend */}
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
                      {[['≥8','#4ade80','Strong'],['≥6','#60a5fa','Good'],['≥4','#facc15','Fair'],['<4','#f87171','Weak']].map(([r,c,l]) => (
                        <div key={r} className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
                          <span className="text-[10px] text-zinc-500">{r} {l}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Activity Heatmap */}
                <ActivityHeatmap sessions={s} totalSessions={totalSessions} />

                {/* Company Readiness */}
                <CompanyReadiness topicMap={topicMap} />

                {/* Topic mastery + Achievements */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4">
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
                          const bar = TOPIC_BAR[topic] ?? 'bg-zinc-500'
                          const badge = TOPIC_COLORS[topic] ?? 'bg-zinc-800 text-zinc-300 border-zinc-700'
                          return (
                            <div key={topic} className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-3.5">
                              <div className="flex items-center justify-between mb-2">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${badge}`}>{topic}</span>
                                <div className="flex items-center gap-2">
                                  {trend > 0.5  && <span className="text-[10px] text-green-400 font-semibold">↑</span>}
                                  {trend < -0.5 && <span className="text-[10px] text-red-400 font-semibold">↓</span>}
                                  <span className={`text-sm font-extrabold ${scoreBarColor(avg).replace('bg-','text-').replace('-500','-400')}`}>{avg.toFixed(1)}</span>
                                </div>
                              </div>
                              <div
                                className="h-1.5 bg-zinc-700 rounded-full overflow-hidden mb-1.5"
                                role="progressbar"
                                aria-valuenow={Math.round(avg * 10)}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-label={`${topic} mastery: ${avg.toFixed(1)} out of 10`}
                              >
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
                  <AchievementsPanel achievements={achievements} />
                </div>

                {/* Recent Sessions */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Recent Sessions</p>
                    {s.length > 0 && (
                      <Link href="/sessions" className="text-xs text-orange-400 hover:text-orange-300 font-semibold transition-colors">
                        View All {s.length > 5 ? `(${s.length})` : ''} →
                      </Link>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    {s.slice(0, 5).map(sess => (
                      <Link key={sess.id} href={`/sessions/${sess.id}`}
                        className={`flex items-center gap-3 p-3 rounded-xl border hover:brightness-110 transition-all ${gradeBg(sess.grade)}`}>
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
                      </Link>
                    ))}
                  </div>
                  {s.length === 0 && (
                    <p className="text-xs text-zinc-600 text-center py-4">No sessions yet — <Link href="/interview?tab=simulator" className="text-orange-400 hover:text-orange-300">start your first one</Link></p>
                  )}
                </div>
              </>
            )}

            {/* What To Do Next */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-4 h-4 text-orange-400" />
                <p className="text-sm font-bold text-zinc-100">What To Do Next</p>
                {totalSessions > 0 && <span className="text-xs text-zinc-500 ml-1">— based on your progress</span>}
              </div>
              <div className="flex flex-col gap-2.5">
                {nextActions.slice(0, 3).map(action => (
                  <Link key={action.href + action.label} href={action.href}
                    className={`group flex items-center gap-4 p-4 rounded-xl border transition-all hover:brightness-110 ${action.accent}`}>
                    <div className="w-8 h-8 bg-zinc-800/60 rounded-lg flex items-center justify-center text-zinc-400 group-hover:text-zinc-200 shrink-0 transition-colors">{action.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-zinc-100">{action.label}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{action.sub}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </Link>
                ))}
              </div>
            </div>

            <PreparationToolkit />

            <div className="flex gap-3">
              <Link href="/interview?tab=simulator" className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/20">
                <BrainCircuit className="w-4 h-4" /> New Practice Session
              </Link>
              <Link href="/questions" className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-sm font-semibold px-5 py-3.5 rounded-xl transition-colors">
                <Library className="w-4 h-4" /> Browse Questions
              </Link>
            </div>
          </div>

          {/* Achievement alert overlay */}
          <AchievementAlert achievements={achievements.map(a => ({ id: a.id, emoji: a.emoji, label: a.label, unlocked: a.unlocked }))} />

          {/* ──────── RIGHT: sticky sidebar ──────── */}
          <div className="w-full lg:w-[300px] shrink-0">
            <div className="flex flex-col gap-4 lg:sticky lg:top-20">
              <LeaderboardCard entries={displayedEntries} nameMap={nameMap} userRank={userRank} totalUsers={totalUsers} />

              {/* Sessions history card */}
              {totalSessions > 0 && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <BrainCircuit className="w-4 h-4 text-violet-400" />
                      <p className="text-sm font-bold text-zinc-200">Interview History</p>
                    </div>
                    <Link href="/sessions" className="text-xs text-orange-400 hover:text-orange-300 font-semibold transition-colors">
                      View All →
                    </Link>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[
                      { label: 'Total', value: totalSessions, color: 'text-zinc-100' },
                      { label: 'Avg',   value: `${overallAvg.toFixed(1)}`, color: 'text-blue-400' },
                      { label: 'Best',  value: `${bestScore.toFixed(1)}`, color: 'text-green-400' },
                    ].map(s => (
                      <div key={s.label} className="bg-zinc-800/50 rounded-xl p-2">
                        <p className={`text-sm font-extrabold ${s.color}`}>{s.value}</p>
                        <p className="text-[10px] text-zinc-600">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <CodeLabCard stats={codeStats} />
              <XPCard />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
