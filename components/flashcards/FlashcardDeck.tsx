'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, RotateCcw, CheckCircle2, XCircle, BookOpen, BrainCircuit } from 'lucide-react'
import type { TopicMeta } from '@/lib/topic-data'

interface Props { topic: TopicMeta }

export default function FlashcardDeck({ topic }: Props) {
  const [index, setIndex]       = useState(0)
  const [flipped, setFlipped]   = useState(false)
  const [known, setKnown]       = useState<Set<number>>(new Set())
  const [learning, setLearning] = useState<Set<number>>(new Set())
  const [done, setDone]         = useState(false)

  const card    = topic.cards[index]
  const total   = topic.cards.length
  const progress = Math.round(((known.size + learning.size) / total) * 100)

  const next = useCallback((mark?: 'known' | 'learning') => {
    if (mark === 'known')    setKnown(s => new Set([...s, index]))
    if (mark === 'learning') setLearning(s => new Set([...s, index]))
    setFlipped(false)
    if (index + 1 >= total) { setDone(true); return }
    setTimeout(() => setIndex(i => i + 1), 150)
  }, [index, total])

  function restart() {
    setIndex(0); setFlipped(false); setKnown(new Set()); setLearning(new Set()); setDone(false)
  }

  if (done) {
    return (
      <div className="min-h-screen bg-zinc-950 pt-20 pb-16 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center mx-auto mb-5 ${topic.bg}`}>
            <BookOpen className={`w-7 h-7 ${topic.color}`} />
          </div>
          <h2 className="text-2xl font-extrabold text-zinc-100 mb-2">Deck complete!</h2>
          <p className="text-zinc-400 text-sm mb-6">You went through all {total} {topic.label} flashcards.</p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 text-center">
              <p className="text-2xl font-extrabold text-green-400">{known.size}</p>
              <p className="text-xs text-zinc-500 mt-1">I know this</p>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 text-center">
              <p className="text-2xl font-extrabold text-orange-400">{learning.size}</p>
              <p className="text-xs text-zinc-500 mt-1">Still learning</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {learning.size > 0 && (
              <button onClick={restart} className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold py-3 rounded-xl transition-colors">
                <RotateCcw className="w-4 h-4" /> Practice Again
              </button>
            )}
            <Link href="/interview" className="flex items-center justify-center gap-2 w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-sm font-semibold py-3 rounded-xl transition-colors">
              <BrainCircuit className="w-4 h-4" /> Test Yourself with Real Questions
            </Link>
            <Link href="/flashcards" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
              ← All Topics
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 pt-20 pb-16">
      <div className="max-w-lg mx-auto px-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/flashcards" className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
            <ArrowLeft className="w-4 h-4" /> All Decks
          </Link>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${topic.bg} ${topic.color}`}>
            {topic.label}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-zinc-500 mb-2">
            <span>{index + 1} / {total}</span>
            <span>{known.size} known · {learning.size} learning</span>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full ${topic.bar} rounded-full transition-all duration-300`}
              style={{ width: `${((index) / total) * 100}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div
          className="relative cursor-pointer select-none mb-6"
          style={{ perspective: '1000px', height: '280px' }}
          onClick={() => setFlipped(f => !f)}
        >
          <div
            className="w-full h-full transition-transform duration-500"
            style={{
              transformStyle: 'preserve-3d',
              transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            {/* Front */}
            <div
              className="absolute inset-0 bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-4 ${topic.bg}`}>
                <BookOpen className={`w-5 h-5 ${topic.color}`} />
              </div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Concept</p>
              <p className="text-lg font-bold text-zinc-100 leading-relaxed">{card.front}</p>
              <p className="text-xs text-zinc-600 mt-4">Tap to reveal answer</p>
            </div>

            {/* Back */}
            <div
              className={`absolute inset-0 border rounded-2xl p-8 flex flex-col items-center justify-center text-center ${topic.bg}`}
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Answer</p>
              <p className="text-sm text-zinc-200 leading-relaxed">{card.back}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        {!flipped ? (
          <div className="flex gap-3">
            <button
              onClick={() => next()}
              className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-sm font-semibold py-3.5 rounded-xl transition-colors"
            >
              Reveal Answer
            </button>
            <button onClick={() => next()} className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-400 text-sm font-semibold px-4 py-3.5 rounded-xl transition-colors">
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => next('learning')}
              className="flex-1 flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-semibold py-3.5 rounded-xl transition-colors"
            >
              <XCircle className="w-4 h-4" /> Still Learning
            </button>
            <button
              onClick={() => next('known')}
              className="flex-1 flex items-center justify-center gap-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 text-sm font-semibold py-3.5 rounded-xl transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" /> I Know This
            </button>
          </div>
        )}

        {/* Deck progress dots */}
        <div className="flex justify-center gap-1 mt-6 flex-wrap">
          {topic.cards.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                i === index ? `${topic.bar} scale-125` :
                known.has(i) ? 'bg-green-500' :
                learning.has(i) ? 'bg-orange-500' :
                'bg-zinc-700'
              }`}
            />
          ))}
        </div>

      </div>
    </div>
  )
}
