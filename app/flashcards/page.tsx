import type { Metadata } from 'next'
import Link from 'next/link'
import { BookOpen, ArrowRight } from 'lucide-react'
import { TOPICS } from '@/lib/topic-data'
import FlashcardsHub from '@/components/flashcards/FlashcardsHub'

const totalCards = TOPICS.reduce((sum, t) => sum + t.cards.length, 0)

export const metadata: Metadata = {
  title: 'Free AI/ML Interview Flashcards — LLM, RAG, Agents & More',
  description: `${totalCards}+ free flashcards across ${TOPICS.length} AI/ML topics — LLMs, RAG, Agents, Transformers, MLOps and more. 5 minutes a day to master every key interview concept.`,
  alternates: { canonical: 'https://amanailab.com/flashcards' },
  openGraph: {
    title: 'Free AI/ML Interview Flashcards',
    description: `${totalCards}+ flashcards across ${TOPICS.length} topics. Master every key AI/ML interview concept, 5 minutes a day.`,
    url: 'https://amanailab.com/flashcards',
    images: [{ url: '/api/og/tool?name=AI%2FML+Flashcards&tagline=5-minute+daily+concept+revision&emoji=%F0%9F%83%8F&tool=flashcards', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free AI/ML Interview Flashcards',
    description: `${totalCards}+ flashcards across ${TOPICS.length} AI/ML topics — free, no sign-up.`,
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'AI/ML Interview Flashcards',
  applicationCategory: 'EducationalApplication',
  description: `${totalCards}+ free flashcards across ${TOPICS.length} AI/ML interview topics.`,
  url: 'https://amanailab.com/flashcards',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  operatingSystem: 'Web Browser',
}

export default function FlashcardsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 pt-20 pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
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

        <FlashcardsHub />

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
