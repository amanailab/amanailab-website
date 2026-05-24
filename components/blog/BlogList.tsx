'use client'

import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useRef, useState } from 'react'
import { Clock, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import type { BlogPost } from '@/lib/admin'
import { BLOG_CATEGORIES, blogCategoryStyle } from '@/lib/blog-categories'

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
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {BLOG_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategory(cat)}
              className={`text-xs font-medium px-3 py-1 rounded-full border transition-colors ${
                category === cat
                  ? blogCategoryStyle(cat)
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

      {/* Articles */}
      {posts.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900 border border-zinc-800 rounded-2xl">
          <div className="text-4xl mb-4">📝</div>
          <p className="text-zinc-300 font-semibold mb-2">No articles found</p>
          <p className="text-zinc-600 text-sm">Try adjusting your search or filter to find what you're looking for.</p>
        </div>
      ) : (
        <>
          {/* Featured first post — only on page 1 without filters */}
          {page === 1 && !search && !category && posts[0] && (
            <Link
              href={`/blog/${posts[0].slug}`}
              className="group block bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-600 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 mb-6"
            >
              <div className="flex flex-col sm:flex-row">
                <div className="relative sm:w-[45%] overflow-hidden" style={{ height: 220 }}>
                  {posts[0].cover_image ? (
                    <Image
                      src={posts[0].cover_image}
                      alt={posts[0].title}
                      fill
                      priority
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-500/20 to-zinc-800">
                      <span className="text-6xl font-bold text-orange-500/30">{posts[0].title[0]}</span>
                    </div>
                  )}
                  <div className="absolute top-3 left-3 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                    Latest
                  </div>
                </div>
                <div className="flex-1 p-6 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${blogCategoryStyle(posts[0].category)}`}>
                      {posts[0].category}
                    </span>
                    <span className="text-xs text-zinc-500">{formatDate(posts[0].created_at)}</span>
                  </div>
                  <h2 className="text-xl font-bold text-zinc-100 mb-3 leading-snug group-hover:text-orange-400 transition-colors line-clamp-2">
                    {posts[0].title}
                  </h2>
                  {posts[0].description && (
                    <p className="text-sm text-zinc-400 line-clamp-2 mb-4 leading-relaxed">{posts[0].description}</p>
                  )}
                  <div className="flex items-center gap-1 text-xs text-zinc-500">
                    <Clock className="w-3 h-3" />
                    <span>{posts[0].read_time}</span>
                  </div>
                </div>
              </div>
            </Link>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {(page === 1 && !search && !category ? posts.slice(1) : posts).map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-600 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20"
            >
              {post.cover_image ? (
                <div className="relative overflow-hidden aspect-video">
                  <Image
                    src={post.cover_image}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900 aspect-video">
                  <span className="text-4xl font-bold text-zinc-700">{post.title[0]}</span>
                </div>
              )}

              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${blogCategoryStyle(post.category)}`}>
                    {post.category}
                  </span>
                  <span className="text-xs text-zinc-500">{formatDate(post.created_at)}</span>
                </div>

                <h2 className="text-sm font-semibold text-zinc-100 mb-1.5 line-clamp-2 group-hover:text-orange-400 transition-colors">
                  {post.title}
                </h2>

                {post.description && (
                  <p className="text-xs text-zinc-400 line-clamp-2 mb-3">{post.description}</p>
                )}

                <div className="flex items-center gap-1 text-xs text-zinc-500">
                  <Clock className="w-3 h-3" />
                  <span>{post.read_time}</span>
                </div>
              </div>
            </Link>
          ))}
          </div>
        </>
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
