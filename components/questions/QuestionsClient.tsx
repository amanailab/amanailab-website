'use client'

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, ChevronDown, ChevronUp, Lightbulb, Library, Bookmark, BookmarkCheck } from 'lucide-react'
import Link from 'next/link'
import AnswerMarkdown from './AnswerMarkdown'

const BOOKMARKS_KEY = 'bookmarked_questions'

function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set())
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) ?? '[]') as string[]
      setBookmarks(new Set(stored))
    } catch { /* ignore */ }
  }, [])
  const toggle = useCallback((id: string) => {
    setBookmarks(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      try { localStorage.setItem(BOOKMARKS_KEY, JSON.stringify([...next])) } catch { /* ignore */ }
      return next
    })
  }, [])
  return { bookmarks, toggle }
}

interface Question {
  id: string; question: string; model_answer: string
  topic: string; level: string; company?: string; company_slug?: string; source: string
}

const TOPIC_COLORS: Record<string, string> = {
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

const ALL_TOPICS = ['LLM','RAG','Agents','Fine-Tuning','MLOps','Transformers','System Design','Python','Vector DB','Computer Vision','NLP','Statistics','SQL & Data','Behavioral']
const LEVELS = ['Fresher','Mid','Senior']
const PAGE = 20

function QuestionCard({ q, bookmarked, onBookmark }: { q: Question; bookmarked: boolean; onBookmark: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors">
      <button onClick={() => setOpen(!open)} className="w-full flex items-start gap-3 p-4 text-left">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${TOPIC_COLORS[q.topic] ?? 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>{q.topic}</span>
            <span className="text-[10px] text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-700">{q.level}</span>
            {q.company && (
              <Link href={`/companies/${q.company_slug}`} onClick={e => e.stopPropagation()}
                className="text-[10px] text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full hover:bg-orange-500/20 transition-colors">
                {q.company}
              </Link>
            )}
          </div>
          <p className="text-sm text-zinc-200 leading-relaxed">{q.question}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={e => { e.stopPropagation(); onBookmark(q.id) }}
            aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark this question'}
            className={`p-1.5 rounded-lg transition-colors ${bookmarked ? 'text-orange-400 bg-orange-500/10' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'}`}
          >
            {bookmarked ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
          </button>
          {open ? <ChevronUp className="w-4 h-4 text-zinc-600" /> : <ChevronDown className="w-4 h-4 text-zinc-600" />}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-zinc-800">
          <div className="flex items-start gap-2 mt-3">
            <Lightbulb className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-orange-400 uppercase tracking-wide mb-1.5">Model Answer</p>
              <AnswerMarkdown text={q.model_answer} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface Props {
  initialQuestions: Question[]
  companies: { id: number; name: string; slug: string }[]
  totalCount: number
}

export default function QuestionsClient({ initialQuestions, companies, totalCount }: Props) {
  const { bookmarks, toggle: toggleBookmark } = useBookmarks()
  const searchParams = useSearchParams()
  const [search, setSearch]               = useState('')
  const [filterTopic, setFilterTopic]     = useState('all')
  const [filterLevel, setFilterLevel]     = useState('all')
  const [filterCompany, setFilterCompany] = useState('all')
  const [showSaved, setShowSaved]         = useState(false)
  const [page, setPage]                   = useState(0)
  const topRef = useRef<HTMLDivElement>(null)

  // Pre-fill search from URL ?q= param (e.g. coming from GlobalSearch)
  useEffect(() => {
    const q = searchParams.get('q')
    if (q) { setSearch(q); setPage(0) }
  }, [searchParams])

  // Scroll to the top of the question list whenever the page changes
  useEffect(() => {
    if (page > 0) {
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [page])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return initialQuestions.filter(x =>
      (showSaved ? bookmarks.has(x.id) : true) &&
      (filterTopic   === 'all' || x.topic?.trim().toLowerCase() === filterTopic.toLowerCase()) &&
      (filterLevel   === 'all' || x.level?.trim().toLowerCase() === filterLevel.toLowerCase()) &&
      (filterCompany === 'all' || (filterCompany === 'general' ? !x.company : x.company_slug === filterCompany)) &&
      (!q || x.question.toLowerCase().includes(q) || x.topic?.toLowerCase().includes(q))
    )
  }, [initialQuestions, filterTopic, filterLevel, filterCompany, search, showSaved, bookmarks])

  const paginated   = filtered.slice(page * PAGE, (page + 1) * PAGE)
  const totalPages  = Math.ceil(filtered.length / PAGE)

  function reset() { setFilterTopic('all'); setFilterLevel('all'); setFilterCompany('all'); setSearch(''); setPage(0); setShowSaved(false) }

  const hasFilters = filterTopic !== 'all' || filterLevel !== 'all' || filterCompany !== 'all' || search

  return (
    <>
      {/* Scroll anchor — page-change scrolls here */}
      <div ref={topRef} className="scroll-mt-24" />

      {/* Search + Filters */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-6 flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(0) }}
            placeholder="Search questions…"
            className="w-full bg-zinc-800 border border-zinc-700 focus:border-orange-500 rounded-xl pl-9 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors" />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <select value={filterTopic} onChange={e => { setFilterTopic(e.target.value); setPage(0) }} className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-300 outline-none">
            <option value="all">All Topics</option>
            {ALL_TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={filterLevel} onChange={e => { setFilterLevel(e.target.value); setPage(0) }} className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-300 outline-none">
            <option value="all">All Levels</option>
            {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <select value={filterCompany} onChange={e => { setFilterCompany(e.target.value); setPage(0) }} className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-300 outline-none">
            <option value="all">All Sources</option>
            <option value="general">General</option>
            {companies.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
          <button onClick={() => { setShowSaved(v => !v); setPage(0) }}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition-all ${showSaved ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200'}`}>
            <BookmarkCheck className="w-3.5 h-3.5" /> Saved {bookmarks.size > 0 && `(${bookmarks.size})`}
          </button>
          {(hasFilters || showSaved) && <button onClick={() => { reset(); setShowSaved(false) }} className="text-xs text-zinc-500 hover:text-zinc-300 px-3 py-2 rounded-lg hover:bg-zinc-800 transition-colors">Clear</button>}
          <span className="text-xs text-zinc-500 ml-auto">{filtered.length} of {totalCount} questions</span>
        </div>
      </div>

      {/* Questions */}
      {paginated.length === 0 ? (
        <div className="text-center py-16">
          <Library className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500 mb-2">No questions match your filters.</p>
          <button onClick={reset} className="text-sm text-orange-400 hover:text-orange-300">Clear all filters</button>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2.5 mb-6">
            {paginated.map(q => <QuestionCard key={q.id} q={q} bookmarked={bookmarks.has(q.id)} onBookmark={toggleBookmark} />)}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className="text-sm text-zinc-400 hover:text-zinc-100 disabled:opacity-30 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl transition-colors">← Prev</button>
              <span className="text-xs text-zinc-500">{page + 1} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                className="text-sm text-zinc-400 hover:text-zinc-100 disabled:opacity-30 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl transition-colors">Next →</button>
            </div>
          )}
        </>
      )}
    </>
  )
}
