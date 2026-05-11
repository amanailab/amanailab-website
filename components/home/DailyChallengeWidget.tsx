"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Flame, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react'

interface StoredEntry {
  date: string
  result: { score: number; verdict: string }
}

function scoreColor(s: number) {
  if (s >= 8) return 'text-green-400'
  if (s >= 6) return 'text-blue-400'
  if (s >= 4) return 'text-yellow-400'
  return 'text-red-400'
}

export default function DailyChallengeWidget() {
  const [preview, setPreview]       = useState('')
  const [topic, setTopic]           = useState('')
  const [level, setLevel]           = useState('')
  const [streak, setStreak]         = useState(0)
  const [answered, setAnswered]     = useState(false)
  const [score, setScore]           = useState(0)
  const [verdict, setVerdict]       = useState('')
  const [loaded, setLoaded]         = useState(false)
  const [today, setToday]           = useState('')

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch('/api/daily/question')
        if (!res.ok) return
        const data = await res.json()
        setToday(data.date)
        setPreview(data.question.question.slice(0, 100) + (data.question.question.length > 100 ? '…' : ''))
        setTopic(data.question.topic)
        setLevel(data.question.level)

        // Check streak from history
        const history: string[] = (() => {
          try { return JSON.parse(localStorage.getItem('daily_challenge_history') ?? '[]') } catch { return [] }
        })()

        // Calc streak
        const dates = [...new Set(history)].sort((a, b) => b.localeCompare(a))
        // Use local date (en-CA = YYYY-MM-DD) to match streak logic in daily/page.tsx
        const localDate = (d: Date) => d.toLocaleDateString('en-CA')
        const yesterday = localDate(new Date(Date.now() - 86400000))
        if (dates.includes(data.date) || dates.includes(yesterday)) {
          let s = 0; let cursor = data.date
          for (let i = 0; i < 365; i++) {
            if (dates.includes(cursor)) { s++; cursor = localDate(new Date(new Date(cursor).getTime() - 86400000)) }
            else { if (cursor === data.date) { cursor = yesterday; continue } break }
          }
          setStreak(s)
        }

        // Check if answered today
        const stored: StoredEntry | null = (() => {
          try { return JSON.parse(localStorage.getItem('daily_challenge_entry') ?? 'null') } catch { return null }
        })()
        if (stored && stored.date === data.date) {
          setAnswered(true)
          setScore(stored.result.score)
          setVerdict(stored.result.verdict)
        }
      } catch { /* silent */ }
      finally { setLoaded(true) }
    }
    init()
  }, [])

  if (!loaded || !preview) return null

  const topicBadge: Record<string, string> = {
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

  return (
    <section className="py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/daily" className="group block bg-zinc-900 border border-zinc-800 hover:border-orange-500/40 rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-500/5">

          {/* Top row: icon + label + CTA (always visible) */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center justify-center shrink-0">
                <Flame className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-orange-400 uppercase tracking-wider">Daily Challenge</p>
                  {streak > 0 && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold bg-orange-500/10 border border-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded-full">
                      <Flame className="w-2.5 h-2.5" /> {streak}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  {new Date(today + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
              </div>
            </div>

            {/* CTA — always top-right on all screen sizes */}
            <div className="shrink-0">
              {answered ? (
                <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-3 py-2 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <div className="text-right">
                    <p className={`text-sm font-bold ${scoreColor(score)}`}>{score}/10</p>
                    <p className="text-[10px] text-green-400">{verdict}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-orange-500 group-hover:bg-orange-400 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="hidden sm:block">Answer Now</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              )}
            </div>
          </div>

          {/* Question preview */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${topicBadge[topic] ?? 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                {topic}
              </span>
              <span className="text-[10px] text-zinc-600">{level}</span>
            </div>
            <p className="text-sm text-zinc-300 group-hover:text-zinc-200 leading-relaxed transition-colors line-clamp-2">
              {preview}
            </p>
          </div>

        </Link>
      </div>
    </section>
  )
}
