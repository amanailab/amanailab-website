"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { BookmarkCheck, ChevronDown, ChevronUp, Lightbulb, ArrowLeft, Library } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

interface Question {
  id: string; question: string; model_answer: string; topic: string; level: string
}

const DIFF_COLORS: Record<string, string> = {
  LLM: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  RAG: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  Agents: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'Fine-Tuning': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  MLOps: 'bg-green-500/20 text-green-300 border-green-500/30',
  Transformers: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
}

function QuestionCard({ q, onRemove }: { q: Question; onRemove: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors">
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-start gap-3 p-4 text-left">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${DIFF_COLORS[q.topic] ?? 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>{q.topic}</span>
            <span className="text-[10px] text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-700">{q.level}</span>
          </div>
          <p className="text-sm text-zinc-200 leading-relaxed">{q.question}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={e => { e.stopPropagation(); onRemove(q.id) }}
            className="p-1.5 text-orange-400/60 hover:text-orange-400 hover:bg-orange-500/10 rounded-lg transition-colors"
            title="Remove bookmark">
            <BookmarkCheck className="w-3.5 h-3.5" />
          </button>
          {open ? <ChevronUp className="w-4 h-4 text-zinc-600" /> : <ChevronDown className="w-4 h-4 text-zinc-600" />}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-zinc-800">
          <div className="flex items-start gap-2 mt-3">
            <Lightbulb className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-orange-400 uppercase tracking-wide mb-1.5">Model Answer</p>
              <p className="text-sm text-zinc-300 leading-relaxed">{q.model_answer}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function SavedQuestionsClient() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading]     = useState(true)
  const [ids, setIds]             = useState<string[]>([])

  useEffect(() => {
    try {
      const stored: string[] = JSON.parse(localStorage.getItem('bookmarked_questions') ?? '[]')
      setIds(stored)
      if (stored.length === 0) { setLoading(false); return }
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      // IDs are formatted as "g-123" (general) or "c-123" (company)
      const generalIds = stored.filter(id => id.startsWith('g-')).map(id => parseInt(id.slice(2)))
      if (generalIds.length === 0) { setLoading(false); return }
      supabase.from('interview_questions').select('id, question, answer, topic, level')
        .in('id', generalIds)
        .then(({ data }) => {
          setQuestions((data ?? []).map(q => ({ id: `g-${q.id}`, question: q.question, model_answer: q.answer, topic: q.topic, level: q.level })))
          setLoading(false)
        })
    } catch { setLoading(false) }
  }, [])

  const removeBookmark = (id: string) => {
    const newIds = ids.filter(i => i !== id)
    setIds(newIds)
    setQuestions(prev => prev.filter(q => q.id !== id))
    localStorage.setItem('bookmarked_questions', JSON.stringify(newIds))
  }

  return (
    <div className="min-h-screen bg-zinc-950 pt-20 pb-16">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/questions" className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> All Questions
          </Link>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center justify-center">
            <BookmarkCheck className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-zinc-100">Saved Questions</h1>
            <p className="text-zinc-500 text-sm mt-0.5">{questions.length} bookmarked question{questions.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col gap-2.5">
            {[1,2,3].map(i => <div key={i} className="h-16 bg-zinc-900 border border-zinc-800 rounded-xl animate-pulse" />)}
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-16 bg-zinc-900 border border-zinc-800 rounded-2xl">
            <Library className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-400 font-semibold mb-2">No saved questions yet</p>
            <p className="text-zinc-600 text-sm mb-6">Bookmark questions from the Question Bank to study them here</p>
            <Link href="/questions" className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
              Browse Questions →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {questions.map(q => <QuestionCard key={q.id} q={q} onRemove={removeBookmark} />)}
          </div>
        )}
      </div>
    </div>
  )
}
