"use client"

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

interface Achievement { id: string; emoji: string; label: string; unlocked: boolean }

const STORAGE_KEY = 'seen_achievements'

export default function AchievementAlert({ achievements }: { achievements: Achievement[] }) {
  const [toasts, setToasts] = useState<Achievement[]>([])

  useEffect(() => {
    const unlockedIds  = achievements.filter(a => a.unlocked).map(a => a.id)
    const seen: string[] = (() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') } catch { return [] } })()

    const newOnes = achievements.filter(a => a.unlocked && !seen.includes(a.id))

    if (newOnes.length > 0) {
      setToasts(newOnes)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(unlockedIds))

      // Fire confetti for new achievements
      import('canvas-confetti').then(({ default: confetti }) => {
        const colors = ['#facc15', '#f97316', '#ec4899', '#8b5cf6', '#06b6d4']
        confetti({ particleCount: 80, spread: 100, origin: { y: 0.5 }, shapes: ['star'], colors })
        setTimeout(() => confetti({ particleCount: 50, spread: 70, origin: { y: 0.4 }, colors }), 250)
      })
    } else {
      // Update seen list with any newly unlocked ones (no confetti for existing)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(unlockedIds))
    }
  }, [achievements])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(ach => (
        <div key={ach.id}
          className="pointer-events-auto flex items-center gap-3 bg-zinc-900 border border-yellow-500/30 rounded-2xl px-4 py-3 shadow-xl shadow-black/40 animate-slide-up min-w-[240px]">
          <span className="text-2xl">{ach.emoji}</span>
          <div className="flex-1">
            <p className="text-xs font-bold text-yellow-400">Achievement Unlocked!</p>
            <p className="text-sm font-semibold text-zinc-100">{ach.label}</p>
          </div>
          <button onClick={() => setToasts(prev => prev.filter(t => t.id !== ach.id))}
            className="p-1 hover:bg-zinc-800 rounded transition-colors shrink-0">
            <X className="w-3.5 h-3.5 text-zinc-500" />
          </button>
        </div>
      ))}
    </div>
  )
}
