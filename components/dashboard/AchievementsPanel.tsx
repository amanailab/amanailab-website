'use client'

import { Share2, Medal } from 'lucide-react'

interface Achievement {
  id: string; emoji: string; label: string; desc: string
  unlocked: boolean; progress?: number; total?: number
}

export default function AchievementsPanel({ achievements }: { achievements: Achievement[] }) {
  const unlocked = achievements.filter(a => a.unlocked).length

  function handleShare(ach: Achievement) {
    const text = `I just unlocked the "${ach.label}" achievement on AmanAI Lab! 🎯 #AIInterview #MachineLearning`
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=https://amanailab.com`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

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
            className={`relative flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-center transition-all group ${ach.unlocked ? 'bg-zinc-800/60 border-zinc-700 hover:border-zinc-600' : 'bg-zinc-900/30 border-zinc-800/40 opacity-40'}`}>
            {ach.unlocked && (
              <button
                onClick={() => handleShare(ach)}
                aria-label={`Share "${ach.label}" achievement`}
                className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-zinc-700/0 hover:bg-zinc-700 text-zinc-600 hover:text-zinc-200 transition-all opacity-0 group-hover:opacity-100"
              >
                <Share2 className="w-3 h-3" />
              </button>
            )}
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
