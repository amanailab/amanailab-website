'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

// Numbered pagination with ellipsis. 1-indexed.
function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const delta = 1
  const rangeStart = Math.max(2, current - delta)
  const rangeEnd = Math.min(total - 1, current + delta)

  const pages: (number | '...')[] = [1]
  if (rangeStart > 2) pages.push('...')
  for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i)
  if (rangeEnd < total - 1) pages.push('...')
  pages.push(total)
  return pages
}

interface Props {
  /** 1-indexed current page. */
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export default function Pagination({ currentPage, totalPages, onPageChange, className = '' }: Props) {
  if (totalPages <= 1) return null
  const pages = getPageNumbers(currentPage, totalPages)

  return (
    <div className={`flex flex-wrap items-center justify-center gap-1.5 ${className}`}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
        className="p-2 rounded-lg border border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`dots-${i}`} className="w-8 text-center text-sm text-zinc-600">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            aria-label={`Page ${p}`}
            aria-current={p === currentPage ? 'page' : undefined}
            className={`min-w-8 h-8 px-2 text-sm rounded-lg transition-colors ${
              p === currentPage
                ? 'bg-orange-500 text-white font-medium'
                : 'border border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-100'
            }`}
          >
            {p}
          </button>
        ),
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
        className="p-2 rounded-lg border border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}
