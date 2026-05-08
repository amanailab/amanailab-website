export const revalidate = false

import type { Metadata } from 'next'
import Link from 'next/link'
import { Layers, BookOpen, ArrowRight } from 'lucide-react'
import { TOPICS } from '@/lib/topic-data'

export const metadata: Metadata = {
  title: 'AI/ML Flashcards — Daily 5-Minute Practice | AmanAI Lab',
  description: 'Free AI/ML flashcards for daily practice. Master key concepts in LLM, RAG, Agents, MLOps and more in just 5 minutes a day.',
}

export default function FlashcardsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 pt-20 pb-16">
      <div className="max-w-4xl mx-auto px-4">

        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-1.5 mb-4">
            <BookOpen className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-xs font-semibold text-orange-400 uppercase tracking-wide">Flashcards</span>
          </div>
          <h1 className="text-3xl font-extrabold text-zinc-100 mb-2">AI/ML Daily Flashcards</h1>
          <p className="text-zinc-400 text-sm max-w-lg mx-auto">
            5 minutes a day. Master every key concept before your interview.
            Pick a topic and start flipping.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOPICS.map((topic) => (
            <Link
              key={topic.slug}
              href={`/flashcards/${topic.slug}`}
              className="group bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-2xl p-5 flex flex-col gap-3 transition-all hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between">
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${topic.bg}`}>
                  <BookOpen className={`w-4 h-4 ${topic.color}`} />
                </div>
                <span className="text-[10px] font-semibold text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-full">
                  {topic.cards.length} cards
                </span>
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-100 group-hover:text-white transition-colors">{topic.label}</p>
                <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{topic.concepts.slice(0, 3).join(' · ')}</p>
              </div>
              <div className={`h-1 rounded-full ${topic.bar} opacity-30 group-hover:opacity-60 transition-opacity`} />
            </Link>
          ))}
        </div>

        <div className="mt-10 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="flex-1">
            <p className="text-sm font-bold text-zinc-100 mb-1">Want to test yourself with real questions?</p>
            <p className="text-xs text-zinc-500">The AI Simulator gives you timed questions with instant AI feedback.</p>
          </div>
          <Link href="/interview?tab=simulator" className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-400 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors shrink-0">
            Practice <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>
    </div>
  )
}
