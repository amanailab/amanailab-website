"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Flame, ArrowRight, CheckCircle2 } from 'lucide-react'

export default function DailyChallengeStrip() {
  const [state, setState] = useState<'loading' | 'done' | 'pending'>('loading')
  const [score, setScore]   = useState(0)
  const [verdict, setVerdict] = useState('')
  const [topic, setTopic]   = useState('')

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch('/api/daily/question')
        if (!res.ok) return setState('pending')
        const data = await res.json()
        const today = data.date
        setTopic(data.question.topic)

        const stored = (() => {
          try { return JSON.parse(localStorage.getItem('daily_challenge_entry') ?? 'null') } catch { return null }
        })()
        if (stored?.date === today) {
          setScore(stored.result.score)
          setVerdict(stored.result.verdict)
          setState('done')
        } else {
          setState('pending')
        }
      } catch { setState('pending') }
    }
    check()
  }, [])

  if (state === 'loading' || state === 'done') {
    if (state === 'done') {
      return (
        <div className="bg-green-500/5 border border-green-500/20 rounded-2xl px-5 py-3.5 flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
          <p className="text-sm text-zinc-300 flex-1">
            Daily challenge done — <span className="font-bold text-green-400">{score}/10 · {verdict}</span>
          </p>
          <Link href="/daily" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1">
            View result <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )
    }
    return null
  }

  return (
    <Link href="/daily" className="group flex items-center gap-3 bg-orange-500/5 border border-orange-500/20 hover:border-orange-500/40 rounded-2xl px-5 py-3.5 transition-all">
      <div className="w-8 h-8 bg-orange-500/10 border border-orange-500/20 rounded-lg flex items-center justify-center shrink-0">
        <Flame className="w-4 h-4 text-orange-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors">
          Daily Challenge waiting
        </p>
        <p className="text-xs text-zinc-500 mt-0.5">
          {topic && `Today's ${topic} question — `}Answer to keep your streak alive
        </p>
      </div>
      <div className="flex items-center gap-1.5 bg-orange-500 group-hover:bg-orange-400 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shrink-0">
        Answer <ArrowRight className="w-3 h-3" />
      </div>
    </Link>
  )
}
