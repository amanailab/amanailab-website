"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Search, Star, ArrowRight } from 'lucide-react'

interface Company {
  id: number; name: string; slug: string; logo_emoji: string
  tagline: string; hq: string; size: string; interview_rounds: number; is_featured: boolean
}

export default function CompaniesClient({
  featured, rest, counts,
}: {
  featured: Company[]; rest: Company[]; counts: Record<number, number>
}) {
  const [search, setSearch] = useState('')

  const filterFn = (c: Company) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.tagline?.toLowerCase().includes(search.toLowerCase())

  const filteredFeatured = featured.filter(filterFn)
  const filteredRest     = rest.filter(filterFn)
  const allFiltered      = [...filteredFeatured, ...filteredRest]

  return (
    <>
      {/* Search */}
      <div className="relative max-w-sm mx-auto mb-10">
        <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search companies…"
          className="w-full bg-zinc-900 border border-zinc-800 focus:border-orange-500/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-500 outline-none transition-colors"
        />
      </div>

      {search ? (
        /* Search results — flat list */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {allFiltered.length === 0 ? (
            <p className="col-span-full text-center text-zinc-500 py-12">No companies match &quot;{search}&quot;</p>
          ) : allFiltered.map(c => (
            <CompanyCard key={c.id} c={c} count={counts[c.id] ?? 0} featured={c.is_featured} />
          ))}
        </div>
      ) : (
        <>
          {filteredFeatured.length > 0 && (
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-5">
                <Star className="w-4 h-4 text-orange-400" />
                <h2 className="text-sm font-bold text-zinc-300">Top AI Companies</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredFeatured.map(c => (
                  <CompanyCard key={c.id} c={c} count={counts[c.id] ?? 0} featured />
                ))}
              </div>
            </div>
          )}
          {filteredRest.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-zinc-500 mb-5">More Companies</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRest.map(c => (
                  <CompanyCard key={c.id} c={c} count={counts[c.id] ?? 0} featured={false} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </>
  )
}

function CompanyCard({ c, count, featured }: { c: Company; count: number; featured: boolean }) {
  return (
    <Link href={`/companies/${c.slug}`}
      className={`group flex flex-col gap-3 bg-zinc-900 border rounded-2xl p-5 transition-all hover:-translate-y-0.5 ${featured ? 'border-orange-500/30 ring-1 ring-orange-500/10 hover:border-orange-500/50' : 'border-zinc-800 hover:border-zinc-600'}`}>
      <div className="flex items-start justify-between">
        <span className="text-3xl">{c.logo_emoji}</span>
        {count > 0 ? (
          <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full">
            {count} Q&amp;As
          </span>
        ) : featured ? (
          <span className="text-[10px] font-bold text-orange-400/80 bg-orange-500/5 border border-orange-500/20 px-2 py-0.5 rounded-full">
            Top
          </span>
        ) : null}
      </div>
      <div>
        <p className="text-sm font-bold text-zinc-100 group-hover:text-white transition-colors">{c.name}</p>
        {c.tagline && <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{c.tagline}</p>}
      </div>
      <div className="flex items-center gap-3 mt-auto pt-2 border-t border-zinc-800/50">
        <span className="text-[10px] text-zinc-600">{c.hq}</span>
        {c.interview_rounds > 0 && (
          <span className="text-[10px] text-zinc-600">{c.interview_rounds} rounds</span>
        )}
        <ArrowRight className="w-3 h-3 text-zinc-700 group-hover:text-orange-400 ml-auto transition-colors" />
      </div>
    </Link>
  )
}
