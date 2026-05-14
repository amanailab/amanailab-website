'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, BookOpen, HelpCircle, Code2, ArrowRight } from 'lucide-react'
import type { TopicMeta } from '@/lib/topic-data'

interface TopicWithCounts extends TopicMeta {
  qCount: number
  codeCount: number
}

interface Props {
  topics: TopicWithCounts[]
}

export default function TopicsGrid({ topics }: Props) {
  const [search, setSearch] = useState('')

  const filtered = topics.filter(t =>
    !search ||
    t.label.toLowerCase().includes(search.toLowerCase()) ||
    t.concepts.some(c => c.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <>
      {/* Search */}
      <div className="relative max-w-md mx-auto mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search topics (RAG, attention, fine-tuning…)"
          className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 focus:border-orange-500 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-zinc-500 text-sm">No topics match &ldquo;{search}&rdquo;</p>
          <button
            onClick={() => setSearch('')}
            className="text-xs text-orange-400 hover:text-orange-300 mt-2 block mx-auto"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(topic => (
            <Link
              key={topic.slug}
              href={`/topics/${topic.slug}`}
              className="group bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-2xl p-5 flex flex-col gap-3 transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${topic.bg} ${topic.color}`}>
                  {topic.label}
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed line-clamp-3">{topic.description}</p>
              <div className="flex items-center gap-3 pt-2 border-t border-zinc-800 mt-auto flex-wrap">
                <div className="flex items-center gap-1 text-[10px] text-zinc-600">
                  <BookOpen className="w-3 h-3" /> {topic.cards.length} flashcards
                </div>
                {topic.qCount > 0 && (
                  <div className="flex items-center gap-1 text-[10px] text-zinc-600">
                    <HelpCircle className="w-3 h-3" /> {topic.qCount} questions
                  </div>
                )}
                {topic.codeCount > 0 && (
                  <div className="flex items-center gap-1 text-[10px] text-orange-400/70">
                    <Code2 className="w-3 h-3" /> {topic.codeCount} problems
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
