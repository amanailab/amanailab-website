'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Trophy, BrainCircuit, Flame, ArrowRight, Loader2, Medal } from 'lucide-react'

interface Entry {
  uid: string
  name: string
  avg: number
  sessions: number
}

function rankColor(i: number) {
  if (i === 0) return 'text-yellow-400'
  if (i === 1) return 'text-zinc-300'
  if (i === 2) return 'text-amber-600'
  return 'text-zinc-600'
}

function rankBg(i: number) {
  if (i === 0) return 'bg-yellow-500/10 border-yellow-500/20'
  if (i === 1) return 'bg-zinc-600/10 border-zinc-600/20'
  if (i === 2) return 'bg-amber-600/10 border-amber-600/20'
  return 'bg-zinc-900 border-zinc-800'
}

function scoreColor(avg: number) {
  if (avg >= 8) return 'text-green-400'
  if (avg >= 6) return 'text-blue-400'
  if (avg >= 4) return 'text-yellow-400'
  return 'text-red-400'
}

export default function LeaderboardPage() {
  const [tab, setTab]             = useState<'alltime' | 'weekly'>('weekly')
  const [alltime, setAlltime]     = useState<Entry[]>([])
  const [weekly, setWeekly]       = useState<Entry[]>([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(r => r.json())
      .then(d => {
        setAlltime(d.leaderboard ?? [])
        setWeekly(d.weekly ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const list = tab === 'weekly' ? weekly : alltime

  return (
    <div className="min-h-screen bg-zinc-950 pt-20 pb-16">
      <div className="max-w-2xl mx-auto px-4">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <Trophy className="w-3.5 h-3.5" /> Global Rankings
          </div>
          <h1 className="text-3xl font-extrabold text-zinc-100 mb-2">Leaderboard</h1>
          <p className="text-zinc-500 text-sm">Top performers ranked by average interview score</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1 mb-6">
          {(['weekly', 'alltime'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold rounded-lg transition-all ${
                tab === t ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {t === 'weekly' ? <Flame className="w-3.5 h-3.5 text-orange-400" /> : <Medal className="w-3.5 h-3.5 text-yellow-400" />}
              {t === 'weekly' ? 'This Week' : 'All Time'}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-7 h-7 text-zinc-600 animate-spin" />
          </div>
        ) : list.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
            <BrainCircuit className="w-10 h-10 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-400 font-semibold mb-1">No rankings yet</p>
            <p className="text-zinc-600 text-sm mb-6">Be the first on the leaderboard this week</p>
            <Link href="/interview?tab=simulator"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold px-5 py-3 rounded-xl transition-all">
              <BrainCircuit className="w-4 h-4" /> Start a Session
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {list.map((entry, i) => (
              <div
                key={entry.uid}
                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${rankBg(i)}`}
              >
                {/* Rank */}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-extrabold text-sm ${rankColor(i)} ${rankBg(i)} border`}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                </div>

                {/* Avatar + name */}
                <div className="w-9 h-9 rounded-full bg-orange-500/20 border border-orange-500/20 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-orange-400">{entry.name[0].toUpperCase()}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-200 truncate">{entry.name}</p>
                  <p className="text-xs text-zinc-600">{entry.sessions} session{entry.sessions !== 1 ? 's' : ''}</p>
                </div>

                {/* Score */}
                <div className="flex flex-col items-end shrink-0">
                  <span className={`text-lg font-extrabold ${scoreColor(entry.avg)}`}>{entry.avg}</span>
                  <span className="text-[10px] text-zinc-600">avg /10</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-8 bg-gradient-to-br from-orange-500/10 to-zinc-900 border border-orange-500/20 rounded-2xl p-6 text-center">
          <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
          <p className="text-zinc-200 font-bold mb-1">Claim your spot</p>
          <p className="text-zinc-500 text-sm mb-4">Complete mock interviews to appear on the leaderboard</p>
          <Link
            href="/interview?tab=simulator"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold px-5 py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/20"
          >
            <BrainCircuit className="w-4 h-4" /> Start Interview
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </div>
  )
}
