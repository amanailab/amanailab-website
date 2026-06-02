'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, Library, BookmarkCheck } from 'lucide-react'
import QuestionCard from './QuestionCard'
import Pagination from '@/components/ui/Pagination'
import { useBookmarks } from '@/hooks/useBookmarks'

interface Question {
  id: string; question: string; model_answer: string
  topic: string; level: string; company?: string; company_slug?: string; source: string
}

const ALL_TOPICS = ['LLM','RAG','Agents','Fine-Tuning','MLOps','Transformers','System Design','Python','Vector DB','Computer Vision','NLP','Statistics','SQL & Data','Behavioral']
const LEVELS = ['Fresher','Mid','Senior']
const PAGE = 20

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
            {paginated.map(q => (
              <QuestionCard
                key={q.id}
                q={{ id: q.id, question: q.question, answer: q.model_answer, topic: q.topic, level: q.level, company: q.company, companySlug: q.company_slug }}
                bookmarked={bookmarks.has(q.id)}
                onBookmark={toggleBookmark}
              />
            ))}
          </div>
          <Pagination currentPage={page + 1} totalPages={totalPages} onPageChange={p => setPage(p - 1)} />
        </>
      )}
    </>
  )
}
