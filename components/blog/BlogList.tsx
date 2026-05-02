'use client'

import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useRef, useState } from 'react'
import { Clock, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import type { BlogPost } from '@/lib/admin'

const CATEGORY_COLORS: Record<string, string> = {
  Tutorials: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Interview Prep': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Tools: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  Career: 'bg-green-500/10 text-green-400 border-green-500/20',
  RAG: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  Agents: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  'Fine-Tuning': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  MLOps: 'bg-red-500/10 text-red-400 border-red-500/20',
  'System Design': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
}

const CATEGORIES = Object.keys(CATEGORY_COLORS)

function getCategoryStyle(cat: string) {
  return CATEGORY_COLORS[cat] ?? 'bg-zinc-700 text-zinc-400 border-zinc-600'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function buildUrl(pathname: string, page: number, q: string, category: string) {
  const params = new URLSearchParams()
  if (q) params.set('q', q)
  if (category) params.set('category', category)
  if (page > 1) params.set('page', String(page))
  const qs = params.toString()
  return qs ? `${pathname}?${qs}` : pathname
}

function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const delta = 2
  const rangeStart = Math.max(2, current - delta)
  const rangeEnd = Math.min(total - 1, current + delta)

  const pages: (number | '...')[] = [1]
  if (rangeStart > 2) pages.push('...')
  for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i)
  if (rangeEnd < total - 1) pages.push('...')
  pages.push(total)

  return pages
}

interface BlogListProps {
  posts: BlogPost[]
  total: number
  page: number
  perPage: number
  search: string
  category: string
}

export default function BlogList({ posts, total, page, perPage, search, category }: BlogListProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [searchValue, setSearchValue] = useState(search)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const totalPages = Math.ceil(total / perPage)
  const rangeStart = total === 0 ? 0 : (page - 1) * perPage + 1
  const rangeEnd = Math.min(page * perPage, total)

  const navigate = (p: number, q: string, cat: string) => {
    router.push(buildUrl(pathname, p, q, cat))
  }

  const handleSearch = (value: string) => {
    setSearchValue(value)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      navigate(1, value, category)
    }, 400)
  }

  const handleCategory = (cat: string) => {
    navigate(1, searchValue, cat === category ? '' : cat)
  }

  const handlePage = (p: number) => {
    navigate(p, searchValue, category)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const pageNumbers = getPageNumbers(page, totalPages)

  return (
    <>
      {/* Search + Filter */}
      <div className="mb-8 space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search articles..."
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategory(cat)}
              className={`text-xs font-medium px-3 py-1 rounded-full border transition-colors ${
                category === cat
                  ? getCategoryStyle(cat)
                  : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-600 hover:text-zinc-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Article count */}
      {total > 0 && (
        <p className="text-sm text-zinc-500 mb-6">
          Showing {rangeStart.toLocaleString()}–{rangeEnd.toLocaleString()} of{' '}
          {total.toLocaleString()} articles
        </p>
      )}

      {/* Grid */}
      {posts.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <p className="text-lg mb-2">No articles found.</p>
          <p className="text-sm">Try adjusting your search or filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-600 transition-all hover:-translate-y-0.5"
            >
              {post.cover_image ? (
                <div className="relative overflow-hidden" style={{ height: 180 }}>
                  <Image
                    src={post.cover_image}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ) : (
                <div
                  className="flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900"
                  style={{ height: 180 }}
                >
                  <span className="text-4xl font-bold text-zinc-700">{post.title[0]}</span>
                </div>
              )}

              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full border ${getCategoryStyle(post.category)}`}
                  >
                    {post.category}
                  </span>
                  <span className="text-xs text-zinc-600">{formatDate(post.created_at)}</span>
                </div>

                <h2 className="text-sm font-semibold text-zinc-100 mb-1.5 line-clamp-2 group-hover:text-orange-400 transition-colors">
                  {post.title}
                </h2>

                {post.description && (
                  <p className="text-xs text-zinc-500 line-clamp-2 mb-3">{post.description}</p>
                )}

                <div className="flex items-center gap-1 text-xs text-zinc-600">
                  <Clock className="w-3 h-3" />
                  <span>{post.read_time}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 mt-10">
          <button
            onClick={() => handlePage(page - 1)}
            disabled={page === 1}
            aria-label="Previous page"
            className="p-2 rounded-lg border border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {pageNumbers.map((p, i) =>
            p === '...' ? (
              <span key={`dots-${i}`} className="w-8 text-center text-sm text-zinc-600">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => handlePage(p)}
                className={`w-8 h-8 text-sm rounded-lg transition-colors ${
                  p === page
                    ? 'bg-orange-500 text-white font-medium'
                    : 'border border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-100'
                }`}
              >
                {p}
              </button>
            )
          )}

          <button
            onClick={() => handlePage(page + 1)}
            disabled={page === totalPages}
            aria-label="Next page"
            className="p-2 rounded-lg border border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  )
}
