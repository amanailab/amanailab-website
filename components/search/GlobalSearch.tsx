'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { Search, FileText, BrainCircuit, X } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface BlogResult {
  type: 'blog'
  id: string
  title: string
  description: string
  slug: string
  category: string
  read_time: string
}

interface QuestionResult {
  type: 'question'
  id: number
  question: string
  topic: string
  level: string
}

interface CodeProblemResult {
  type: 'problem'
  id: string
  title: string
  slug: string
  difficulty: string
  topic: string
}

type Result = BlogResult | QuestionResult | CodeProblemResult

export default function GlobalSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    const q = searchParams.get('q') ?? ''
    setQuery(q)
    if (q.trim().length >= 2) runSearch(q)
    else setResults([])
  }, [searchParams])

  async function runSearch(q: string) {
    setLoading(true)
    try {
      const [blogRes, questionsRes, codeRes] = await Promise.all([
        supabase
          .from('blog_posts')
          .select('id, title, description, slug, category, read_time')
          .eq('published', true)
          .or(`title.ilike.%${q}%,description.ilike.%${q}%,tags.cs.{${q}}`)
          .limit(5),
        supabase
          .from('interview_questions')
          .select('id, question, topic, level')
          .ilike('question', `%${q}%`)
          .limit(5),
        supabase
          .from('code_problems')
          .select('id, title, slug, difficulty, topic')
          .or(`title.ilike.%${q}%,topic.ilike.%${q}%`)
          .limit(4),
      ])

      const combined: Result[] = [
        ...(blogRes.data ?? []).map((p) => ({ type: 'blog' as const, ...p })),
        ...(questionsRes.data ?? []).map((q) => ({ type: 'question' as const, ...q })),
        ...(codeRes.data ?? []).map((p) => ({ type: 'problem' as const, ...p })),
      ]
      setResults(combined)
    } finally {
      setLoading(false)
    }
  }

  function handleInput(value: string) {
    setQuery(value)
    clearTimeout(timerRef.current)
    if (value.trim().length < 2) {
      router.replace('/search', { scroll: false })
      setResults([])
      return
    }
    timerRef.current = setTimeout(() => {
      router.replace(`/search?q=${encodeURIComponent(value.trim())}`, { scroll: false })
    }, 400)
  }

  const blogResults     = results.filter((r) => r.type === 'blog')     as BlogResult[]
  const questionResults = results.filter((r) => r.type === 'question') as QuestionResult[]
  const problemResults  = results.filter((r) => r.type === 'problem')  as CodeProblemResult[]
  const hasResults = results.length > 0
  const searched = query.trim().length >= 2

  return (
    <section className="min-h-screen bg-zinc-950 text-zinc-50 pt-28 pb-24 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-extrabold text-zinc-100 mb-8">Search</h1>

        {/* Search input */}
        <div className="relative mb-10">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 pointer-events-none" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => handleInput(e.target.value)}
            placeholder="Search blog posts, interview questions…"
            className="w-full pl-12 pr-12 py-4 bg-zinc-900 border border-zinc-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-2xl text-base text-zinc-100 placeholder-zinc-500 outline-none transition-colors"
          />
          {query && (
            <button
              onClick={() => handleInput('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-3 text-zinc-500 text-sm">
            <span className="w-4 h-4 border-2 border-zinc-700 border-t-orange-500 rounded-full animate-spin" />
            Searching…
          </div>
        )}

        {/* No results */}
        {!loading && searched && !hasResults && (
          <div className="text-center py-16">
            <Search className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-400 text-base mb-1">No results for &ldquo;{query}&rdquo;</p>
            <p className="text-zinc-600 text-sm">Try different keywords</p>
          </div>
        )}

        {/* Results */}
        {!loading && hasResults && (
          <div className="flex flex-col gap-8">
            {blogResults.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-4 h-4 text-orange-400" />
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Blog Posts ({blogResults.length})</span>
                </div>
                <div className="flex flex-col gap-3">
                  {blogResults.map((post) => (
                    <Link
                      key={post.id}
                      href={`/blog/${post.slug}`}
                      className="block bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-xl p-5 transition-all hover:-translate-y-0.5 group"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                          {post.category}
                        </span>
                        <span className="text-xs text-zinc-600">{post.read_time}</span>
                      </div>
                      <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-orange-400 transition-colors mb-1">
                        {post.title}
                      </h3>
                      {post.description && (
                        <p className="text-xs text-zinc-500 line-clamp-2">{post.description}</p>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {questionResults.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <BrainCircuit className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Interview Questions ({questionResults.length})</span>
                </div>
                <div className="flex flex-col gap-3">
                  {questionResults.map((q) => (
                    <Link
                      key={q.id}
                      href={`/questions?q=${encodeURIComponent(q.question.slice(0, 80))}`}
                      className="block bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-xl p-5 transition-all hover:-translate-y-0.5 group"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          {q.topic}
                        </span>
                        <span className="text-xs text-zinc-600">{q.level}</span>
                      </div>
                      <p className="text-sm font-medium text-zinc-200 group-hover:text-purple-300 transition-colors">
                        {q.question}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {problemResults.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[10px]">💻</span>
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Code Lab Problems ({problemResults.length})</span>
                </div>
                <div className="flex flex-col gap-3">
                  {problemResults.map((p) => (
                    <Link key={p.id} href={`/code-lab/${p.slug}`}
                      className="block bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-xl p-4 transition-all hover:-translate-y-0.5 group">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${p.difficulty === 'Easy' ? 'text-green-400 bg-green-500/10 border-green-500/20' : p.difficulty === 'Medium' ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20'}`}>
                          {p.difficulty}
                        </span>
                        <span className="text-xs text-zinc-600">{p.topic}</span>
                      </div>
                      <p className="text-sm font-semibold text-zinc-200 group-hover:text-orange-400 transition-colors">{p.title}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Idle state */}
        {!searched && !loading && (
          <div className="text-center py-16">
            <Search className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
            <p className="text-zinc-600 text-sm">Search across blog posts and interview questions</p>
          </div>
        )}
      </div>
    </section>
  )
}
