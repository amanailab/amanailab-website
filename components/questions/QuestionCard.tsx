'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp, Lightbulb, Bookmark, BookmarkCheck } from 'lucide-react'
import AnswerMarkdown from './AnswerMarkdown'

export const TOPIC_COLORS: Record<string, string> = {
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

export interface QuestionCardData {
  id: string
  question: string
  answer: string
  topic: string
  level: string
  company?: string
  companySlug?: string
}

interface Props {
  q: QuestionCardData
  /** When provided, a bookmark toggle is shown. */
  bookmarked?: boolean
  onBookmark?: (id: string) => void
  defaultOpen?: boolean
}

export default function QuestionCard({ q, bookmarked, onBookmark, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors">
      <button onClick={() => setOpen(!open)} className="w-full flex items-start gap-3 p-4 text-left">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${TOPIC_COLORS[q.topic] ?? 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>{q.topic}</span>
            <span className="text-[10px] text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-700">{q.level}</span>
            {q.company && (
              <Link href={`/companies/${q.companySlug}`} onClick={e => e.stopPropagation()}
                className="text-[10px] text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full hover:bg-orange-500/20 transition-colors">
                {q.company}
              </Link>
            )}
          </div>
          <p className="text-sm text-zinc-200 leading-relaxed">{q.question}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {onBookmark && (
            <button
              onClick={e => { e.stopPropagation(); onBookmark(q.id) }}
              aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark this question'}
              className={`p-1.5 rounded-lg transition-colors ${bookmarked ? 'text-orange-400 bg-orange-500/10' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'}`}
            >
              {bookmarked ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
            </button>
          )}
          {open ? <ChevronUp className="w-4 h-4 text-zinc-600" /> : <ChevronDown className="w-4 h-4 text-zinc-600" />}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-zinc-800">
          <div className="flex items-start gap-2 mt-3">
            <Lightbulb className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-orange-400 uppercase tracking-wide mb-1.5">Model Answer</p>
              <AnswerMarkdown text={q.answer} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
