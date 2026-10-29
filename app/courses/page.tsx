'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  BookOpen, Clock, Users, Star, Search, GraduationCap, Zap, Filter, X, ChevronRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Course = {
  id: string
  slug: string
  title: string
  short_description: string | null
  thumbnail_url: string | null
  price: number
  currency: string
  level: string
  duration_hours: number | null
  students_count: number
  rating: number
  rating_count: number
  is_free: boolean
}

const LEVELS = ['All', 'Beginner', 'Intermediate', 'Advanced']
const PRICE_FILTERS = ['All', 'Free', 'Paid']

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1,2,3,4,5].map(s => (
          <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-zinc-600'}`} />
        ))}
      </div>
      <span className="text-xs text-zinc-400">{rating > 0 ? rating.toFixed(1) : 'New'}</span>
      {count > 0 && <span className="text-xs text-zinc-600">({count})</span>}
    </div>
  )
}

function CourseCard({ course, index }: { course: Course; index: number }) {
  const priceDisplay = course.is_free ? 'Free' : `₹${course.price.toLocaleString('en-IN')}`
  const levelColor = {
    beginner:     'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    intermediate: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    advanced:     'text-orange-400 bg-orange-500/10 border-orange-500/20',
  }[course.level] ?? 'text-zinc-400 bg-zinc-800 border-zinc-700'

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.05 }}>
      <Link href={`/courses/${course.slug}`} className="group flex flex-col bg-zinc-900 border border-zinc-800 hover:border-orange-500/40 rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:shadow-orange-500/5 hover:-translate-y-0.5">
        <div className="relative aspect-video bg-zinc-800 overflow-hidden">
          {course.thumbnail_url ? (
            <Image src={course.thumbnail_url} alt={course.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-500/20 to-zinc-900">
              <GraduationCap className="w-14 h-14 text-orange-500/40" />
            </div>
          )}
          {course.is_free && (
            <span className="absolute top-3 left-3 text-[10px] font-black uppercase tracking-wider px-2 py-1 bg-emerald-500 text-white rounded-full">Free</span>
          )}
        </div>

        <div className="flex flex-col flex-1 p-5 gap-3">
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${levelColor}`}>
              {course.level}
            </span>
            {course.duration_hours && (
              <span className="flex items-center gap-1 text-xs text-zinc-500">
                <Clock className="w-3.5 h-3.5" /> {course.duration_hours}h
              </span>
            )}
          </div>

          <h3 className="font-bold text-zinc-100 text-base leading-snug group-hover:text-orange-400 transition-colors line-clamp-2">{course.title}</h3>
          {course.short_description && (
            <p className="text-sm text-zinc-500 leading-relaxed line-clamp-2">{course.short_description}</p>
          )}

          <div className="mt-auto pt-3 border-t border-zinc-800 flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <StarRating rating={course.rating} count={course.rating_count} />
              <span className="flex items-center gap-1 text-xs text-zinc-600">
                <Users className="w-3 h-3" /> {course.students_count.toLocaleString()} students
              </span>
            </div>
            <span className={`font-black text-lg ${course.is_free ? 'text-emerald-400' : 'text-orange-400'}`}>
              {priceDisplay}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default function CoursesPage() {
  const [courses, setCourses]         = useState<Course[]>([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [levelFilter, setLevel]       = useState('All')
  const [priceFilter, setPrice]       = useState('All')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('courses')
      .select('id,slug,title,short_description,thumbnail_url,price,currency,level,duration_hours,students_count,rating,rating_count,is_free')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setCourses((data as Course[]) ?? []); setLoading(false) })
  }, [])

  const filtered = useMemo(() => courses.filter(c => {
    const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase()) || (c.short_description ?? '').toLowerCase().includes(search.toLowerCase())
    const matchLevel  = levelFilter === 'All' || c.level.toLowerCase() === levelFilter.toLowerCase()
    const matchPrice  = priceFilter === 'All' || (priceFilter === 'Free' ? c.is_free : !c.is_free)
    return matchSearch && matchLevel && matchPrice
  }), [courses, search, levelFilter, priceFilter])

  const hasFilters = levelFilter !== 'All' || priceFilter !== 'All'

  return (
    <main className="min-h-screen bg-zinc-950 pt-20">

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-zinc-800/60">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="flex items-center gap-1.5 text-xs font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-full">
                <Zap className="w-3.5 h-3.5" /> AI/ML Courses by Aman
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-zinc-100 leading-tight mb-4">
              Master AI & ML<br />
              <span className="text-orange-500">From Zero to Production</span>
            </h1>
            <p className="text-lg text-zinc-400 leading-relaxed max-w-xl">
              Structured, in-depth courses on LLMs, RAG, Agents, and more — built by an AI engineer for AI engineers. Buy once, learn forever.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Sticky search + filters */}
      <section className="sticky top-16 z-30 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input type="text" placeholder="Search courses…" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-orange-500/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-300 placeholder:text-zinc-600 outline-none transition-colors" />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"><X className="w-4 h-4" /></button>}
          </div>

          <div className="hidden sm:flex items-center gap-1.5">
            {LEVELS.map(l => (
              <button key={l} onClick={() => setLevel(l)}
                className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${levelFilter === l ? 'bg-orange-500 text-white' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100'}`}>
                {l}
              </button>
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-1.5">
            {PRICE_FILTERS.map(p => (
              <button key={p} onClick={() => setPrice(p)}
                className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${priceFilter === p ? 'bg-orange-500 text-white' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100'}`}>
                {p}
              </button>
            ))}
          </div>

          <button onClick={() => setShowFilters(!showFilters)}
            className={`sm:hidden flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium border transition-colors ${hasFilters ? 'bg-orange-500/10 border-orange-500/40 text-orange-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}>
            <Filter className="w-4 h-4" /> Filters {hasFilters && '·'}
          </button>

          {hasFilters && (
            <button onClick={() => { setLevel('All'); setPrice('All') }} className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-500 hover:text-orange-400 transition-colors">
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>

        {showFilters && (
          <div className="sm:hidden px-4 pb-4 flex flex-col gap-3 border-t border-zinc-800">
            <div className="pt-3">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Level</p>
              <div className="flex flex-wrap gap-1.5">
                {LEVELS.map(l => <button key={l} onClick={() => setLevel(l)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${levelFilter === l ? 'bg-orange-500 text-white' : 'bg-zinc-900 border border-zinc-800 text-zinc-400'}`}>{l}</button>)}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Price</p>
              <div className="flex flex-wrap gap-1.5">
                {PRICE_FILTERS.map(p => <button key={p} onClick={() => setPrice(p)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${priceFilter === p ? 'bg-orange-500 text-white' : 'bg-zinc-900 border border-zinc-800 text-zinc-400'}`}>{p}</button>)}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-video bg-zinc-800" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-zinc-800 rounded w-1/3" />
                  <div className="h-5 bg-zinc-800 rounded w-4/5" />
                  <div className="h-4 bg-zinc-800 rounded w-full" />
                  <div className="h-4 bg-zinc-800 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-5">
            <div className="w-20 h-20 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <BookOpen className="w-9 h-9 text-zinc-600" />
            </div>
            <div className="text-center">
              <p className="text-zinc-300 font-semibold text-lg">
                {courses.length === 0 ? 'Courses coming soon' : 'No courses match your filters'}
              </p>
              <p className="text-zinc-600 text-sm mt-1.5">
                {courses.length === 0 ? 'Be the first to know — join the waitlist' : 'Try adjusting your search or filters'}
              </p>
            </div>
            {courses.length === 0 ? (
              <Link href="/connect-aman" className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm">
                Join Waitlist <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <button onClick={() => { setSearch(''); setLevel('All'); setPrice('All') }} className="text-sm text-orange-400 hover:text-orange-300 underline underline-offset-2">
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-zinc-500 mb-6">
              <span className="text-zinc-300 font-semibold">{filtered.length}</span> course{filtered.length !== 1 ? 's' : ''}{(search || hasFilters) ? ' found' : ''}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((course, i) => <CourseCard key={course.id} course={course} index={i} />)}
            </div>
          </>
        )}
      </section>
    </main>
  )
}
