"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  Target, Loader2, AlertCircle, CheckCircle2, ArrowRight,
  BrainCircuit, Zap, BookOpen,
} from 'lucide-react'

interface TopicPerf { topic: string; avg: number; sessions: number }
interface Gap { topic: string; user_score: number | null; required_level: string; priority: number; action: string }
interface Strength { topic: string; user_score: number; note: string }
interface RequiredTopic { topic: string; importance: string; jd_evidence: string }
interface Result {
  job_title: string; company_type: string; overall_readiness: number
  required_topics: RequiredTopic[]; gaps: Gap[]; strengths: Strength[]
  missing_from_platform: string[]; recommendation: string
}

const TOPIC_SLUGS: Record<string, string> = {
  LLM: 'llm', RAG: 'rag', Agents: 'agents', 'Fine-Tuning': 'fine-tuning',
  MLOps: 'mlops', Transformers: 'transformers', 'System Design': 'system-design',
  Python: 'python', 'Vector DB': 'vector-db', NLP: 'nlp', Statistics: 'statistics',
}

export default function SkillGapClient() {
  const [jd, setJd]           = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState<Result | null>(null)
  const [error, setError]     = useState('')
  const [userPerf, setUserPerf] = useState<TopicPerf[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const { data: sessions } = await supabase
          .from('user_interview_sessions')
          .select('topic, avg_score')
          .eq('user_id', user.id) // Won't work with anon key, but try
        if (sessions) {
          const topicMap: Record<string, number[]> = {}
          sessions.forEach((s: { topic: string; avg_score: number }) => {
            topicMap[s.topic] = [...(topicMap[s.topic] ?? []), s.avg_score]
          })
          setUserPerf(Object.entries(topicMap).map(([topic, scores]) => ({
            topic, avg: Math.round((scores.reduce((a,b) => a+b,0)/scores.length)*10)/10, sessions: scores.length
          })))
        }
      }

      // Load quiz mastery from localStorage (runs for all users, logged-in or not)
      try {
        const quizData = JSON.parse(localStorage.getItem('quiz_mastery') ?? '{}')
        // quizData format: { 'LLM_Mid': { score: 85, attempts: 3, lastDate: '...' } }
        // Convert quiz percentages (0-100) to 0-10 scale to match session scores
        const quizPerf: Record<string, { scores: number[]; sessions: number }> = {}
        Object.entries(quizData).forEach(([key, val]) => {
          const topic = key.split('_')[0] // 'LLM_Mid' → 'LLM'
          const v = val as { score: number; attempts: number }
          if (!quizPerf[topic]) quizPerf[topic] = { scores: [], sessions: 0 }
          quizPerf[topic].scores.push(v.score / 10) // convert 85% → 8.5
          quizPerf[topic].sessions += v.attempts
        })
        // Merge with existing userPerf
        setUserPerf(prev => {
          const merged = [...prev]
          Object.entries(quizPerf).forEach(([topic, qp]) => {
            const existing = merged.find(p => p.topic === topic)
            const quizAvg = qp.scores.reduce((a, b) => a + b, 0) / qp.scores.length
            if (existing) {
              // Weighted average: interview 60%, quiz 40%
              existing.avg = Math.round((existing.avg * 0.6 + quizAvg * 0.4) * 10) / 10
            } else {
              merged.push({ topic, avg: Math.round(quizAvg * 10) / 10, sessions: qp.sessions })
            }
          })
          return merged
        })
      } catch { /* ignore localStorage errors */ }
    }).catch(() => {})
  }, [])

  async function analyze() {
    if (!jd.trim()) return
    setLoading(true); setError(''); setResult(null)
    try {
      const res = await fetch('/api/career/skill-gap', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription: jd, userPerformance: userPerf.length > 0 ? userPerf : null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data)
    } catch (e) { setError((e as Error).message || 'Analysis failed. Try again.') }
    finally { setLoading(false) }
  }

  const readinessColor = (n: number) =>
    n >= 80 ? 'text-green-400' : n >= 60 ? 'text-blue-400' : n >= 40 ? 'text-yellow-400' : 'text-red-400'

  return (
    <div className="min-h-screen bg-zinc-950 pt-20 pb-16">
      <div className="max-w-3xl mx-auto px-4">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-1.5 mb-4">
            <Target className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-xs font-semibold text-orange-400 uppercase tracking-wide">Skill Gap Analyzer</span>
          </div>
          <h1 className="text-3xl font-extrabold text-zinc-100 mb-3">
            Know Exactly What to Study
          </h1>
          <p className="text-zinc-400 text-sm max-w-lg mx-auto">
            Paste any AI/ML job description → get a personalized gap analysis based on your interview performance. Stop guessing, start targeting.
          </p>
        </div>

        {/* Input */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-5">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2 block">
            Job Description
          </label>
          <textarea
            value={jd}
            onChange={e => setJd(e.target.value)}
            placeholder="Paste the full job description here — requirements, responsibilities, nice-to-haves..."
            rows={9}
            className="w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500/60 rounded-xl px-4 py-3 text-sm text-zinc-300 placeholder:text-zinc-500 outline-none transition-colors resize-none"
          />
          <div className="flex items-center justify-between mt-3">
            <p className="text-[10px] text-zinc-600">{jd.length} chars · {userPerf.length > 0 ? `${userPerf.length} topics tracked` : 'No performance data yet — practice quizzes or interviews first'}</p>
            <button onClick={analyze} disabled={!jd.trim() || loading}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/20">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing…</> : <><Target className="w-4 h-4" /> Analyze Gap</>}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl mb-5 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />{error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="flex flex-col gap-5">

            {/* Overview */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-zinc-100">{result.job_title || 'AI/ML Role'}</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">{result.company_type}</p>
                </div>
                <div className="text-right">
                  <p className={`text-3xl font-extrabold ${readinessColor(result.overall_readiness)}`}>{result.overall_readiness}%</p>
                  <p className="text-xs text-zinc-500">Ready</p>
                </div>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden mb-4">
                <div className={`h-full rounded-full transition-all ${result.overall_readiness >= 80 ? 'bg-green-500' : result.overall_readiness >= 60 ? 'bg-blue-500' : result.overall_readiness >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${result.overall_readiness}%` }} />
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed">{result.recommendation}</p>
            </div>

            {/* Gaps — priority order */}
            {result.gaps?.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <p className="text-sm font-bold text-zinc-100">Critical Gaps ({result.gaps.length})</p>
                  <p className="text-xs text-zinc-500 ml-1">— focus here first</p>
                </div>
                <div className="flex flex-col gap-3">
                  {result.gaps.sort((a, b) => a.priority - b.priority).map((g, i) => (
                    <div key={i} className="flex items-start gap-3 bg-red-500/5 border border-red-500/15 rounded-xl p-3.5">
                      <span className="w-5 h-5 bg-red-500/20 text-red-400 text-xs font-bold rounded-full flex items-center justify-center shrink-0">{g.priority}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-sm font-semibold text-zinc-100">{g.topic}</span>
                          <span className="text-[10px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded-full">
                            {g.user_score !== null ? `Your score: ${g.user_score}/10` : 'Not practiced'}
                          </span>
                          <span className="text-[10px] text-zinc-600">Requires: {g.required_level}</span>
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed">{g.action}</p>
                      </div>
                      {TOPIC_SLUGS[g.topic] && (
                        <Link href={`/topics/${TOPIC_SLUGS[g.topic]}`}
                          className="flex items-center gap-1 text-[10px] font-semibold text-orange-400 hover:text-orange-300 bg-orange-500/10 border border-orange-500/20 px-2 py-1 rounded-lg transition-colors shrink-0">
                          Study <ArrowRight className="w-2.5 h-2.5" />
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Strengths */}
            {result.strengths?.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <p className="text-sm font-bold text-zinc-100">Your Strengths ({result.strengths.length})</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {result.strengths.map((s, i) => (
                    <div key={i} className="flex items-center gap-3 bg-green-500/5 border border-green-500/15 rounded-xl p-3">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-zinc-200">{s.topic} <span className="text-green-400">{s.user_score}/10</span></p>
                        <p className="text-[10px] text-zinc-600">{s.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Required topics from JD */}
            {result.required_topics?.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                <p className="text-sm font-bold text-zinc-100 mb-3">All Required Topics</p>
                <div className="flex flex-col gap-2">
                  {result.required_topics.map((t, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs">
                      <span className={`shrink-0 font-bold px-1.5 py-0.5 rounded-full text-[9px] ${t.importance === 'critical' ? 'bg-red-500/20 text-red-400' : t.importance === 'important' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-zinc-800 text-zinc-500'}`}>
                        {t.importance}
                      </span>
                      <div>
                        <span className="font-semibold text-zinc-300">{t.topic}</span>
                        {t.jd_evidence && <span className="text-zinc-600 ml-1.5 italic">"{t.jd_evidence}"</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link href="/interview?tab=simulator"
                className="flex items-center gap-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 rounded-xl p-4 transition-all group">
                <BrainCircuit className="w-5 h-5 text-violet-400 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-zinc-200 group-hover:text-white">Practice Interview</p>
                  <p className="text-[10px] text-zinc-600">Work on your gaps</p>
                </div>
              </Link>
              <Link href="/code-lab"
                className="flex items-center gap-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 rounded-xl p-4 transition-all group">
                <Zap className="w-5 h-5 text-orange-400 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-zinc-200 group-hover:text-white">Code Lab</p>
                  <p className="text-[10px] text-zinc-600">Solve AI/ML problems</p>
                </div>
              </Link>
              <Link href="/topics"
                className="flex items-center gap-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 rounded-xl p-4 transition-all group">
                <BookOpen className="w-5 h-5 text-blue-400 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-zinc-200 group-hover:text-white">Study Topics</p>
                  <p className="text-[10px] text-zinc-600">Deep-dive guides</p>
                </div>
              </Link>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
