'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  Star, Users, Clock, Search, GraduationCap, Zap, X,
  PlayCircle, TrendingUp, Award, ChevronRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Course = {
  id: string; slug: string; title: string; short_description: string | null
  thumbnail_url: string | null; price: number; currency: string
  level: string; duration_hours: number | null; students_count: number
  rating: number; rating_count: number; is_free: boolean
}

const LEVELS      = ['All', 'Beginner', 'Intermediate', 'Advanced']
const PRICE_OPTS  = ['All', 'Free', 'Paid']

function Stars({ r }: { r: number }) {
  return (
    <span className="flex">
      {[1,2,3,4,5].map(s => (
        <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(r) ? 'text-amber-400 fill-amber-400' : 'text-zinc-700'}`} />
      ))}
    </span>
  )
}

function CourseCard({ course, i }: { course: Course; i: number }) {
  const levelCfg = {
    beginner:     { text: 'Beginner',     cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
    intermediate: { text: 'Intermediate', cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
    advanced:     { text: 'Advanced',     cls: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
  }[course.level] ?? { text: course.level, cls: 'bg-zinc-800 text-zinc-400 border-zinc-700' }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: i * 0.06 }}
    >
      <Link
        href={`/courses/${course.slug}`}
        className="group flex flex-col h-full bg-zinc-900 border border-zinc-800/80 hover:border-orange-500/50 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-orange-500/10"
      >
        {/* Thumbnail */}
        <div className="relative aspect-video bg-zinc-800 overflow-hidden shrink-0">
          {course.thumbnail_url ? (
            <Image src={course.thumbnail_url} alt={course.title} fill unoptimized className="object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-zinc-900 to-zinc-950 flex items-center justify-center">
              <GraduationCap className="w-16 h-16 text-orange-500/25" />
            </div>
          )}

          {/* Hover play overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-all duration-300">
            <div className="w-14 h-14 rounded-full bg-orange-500 flex items-center justify-center opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300 shadow-xl shadow-orange-500/50">
              <PlayCircle className="w-7 h-7 text-white" />
            </div>
          </div>

          {/* Badges */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border backdrop-blur-sm ${levelCfg.cls}`}>
              {levelCfg.text}
            </span>
          </div>
          {course.is_free && (
            <span className="absolute top-3 right-3 text-[10px] font-black uppercase px-2.5 py-1 bg-emerald-500 text-white rounded-full">FREE</span>
          )}
          {course.duration_hours && (
            <span className="absolute bottom-2 right-2 flex items-center gap-1 text-[11px] bg-black/70 text-zinc-300 px-2 py-0.5 rounded-full backdrop-blur-sm">
              <Clock className="w-3 h-3" /> {course.duration_hours}h
            </span>
          )}
        </div>

        {/* Body */}
        <div className="flex flex-col flex-1 p-5 gap-3">
          <h3 className="font-bold text-zinc-100 text-[15px] leading-snug group-hover:text-orange-400 transition-colors line-clamp-2">
            {course.title}
          </h3>
          {course.short_description && (
            <p className="text-sm text-zinc-500 leading-relaxed line-clamp-2 flex-1">{course.short_description}</p>
          )}

          {/* Rating */}
          {course.rating > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold text-sm">{course.rating.toFixed(1)}</span>
              <Stars r={course.rating} />
              <span className="text-xs text-zinc-600">({course.rating_count.toLocaleString()})</span>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-zinc-800 mt-auto">
            <span className="flex items-center gap-1.5 text-xs text-zinc-500">
              <Users className="w-3.5 h-3.5" />
              {course.students_count.toLocaleString()} students
            </span>
            <span className={`font-black text-xl leading-none ${course.is_free ? 'text-emerald-400' : 'text-orange-400'}`}>
              {course.is_free ? 'Free' : `â‚¹${course.price.toLocaleString('en-IN')}`}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden animate-pulse">
      <div className="aspect-video bg-zinc-800" />
      <div className="p-5 space-y-3">
        <div className="h-4 bg-zinc-800 rounded-full w-1/3" />
        <div className="h-5 bg-zinc-800 rounded-full w-4/5" />
        <div className="h-4 bg-zinc-800 rounded-full w-full" />
        <div className="h-4 bg-zinc-800 rounded-full w-2/3" />
        <div className="flex justify-between pt-2">
          <div className="h-3 bg-zinc-800 rounded-full w-1/4" />
          <div className="h-5 bg-zinc-800 rounded-full w-1/4" />
        </div>
      </div>
    </div>
  )
}

export default function CoursesPage() {
  const [courses, setCourses]   = useState<Course[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [level, setLevel]       = useState('All')
  const [price, setPrice]       = useState('All')

  useEffect(() => {
    createClient()
      .from('courses')
      .select('id,slug,title,short_description,thumbnail_url,price,currency,level,duration_hours,students_count,rating,rating_count,is_free')
      .eq('is_published', true)
      .order('students_count', { ascending: false })
      .then(({ data }) => { setCourses((data as Course[]) ?? []); setLoading(false) })
  }, [])

  const filtered = useMemo(() => courses.filter(c => {
    const q = search.toLowerCase()
    const matchQ = !q || c.title.toLowerCase().includes(q) || (c.short_description ?? '').toLowerCase().includes(q)
    const matchL = level === 'All' || c.level === level.toLowerCase()
    const matchP = price === 'All' || (price === 'Free' ? c.is_free : !c.is_free)
    return matchQ && matchL && matchP
  }), [courses, search, level, price])

  const totalStudents = courses.reduce((a, c) => a + c.students_count, 0)
  const avgRating     = courses.filter(c => c.rating > 0)
  const avgR          = avgRating.length > 0 ? (avgRating.reduce((a, c) => a + c.rating, 0) / avgRating.length) : 0
  const hasFilters    = level !== 'All' || price !== 'All' || !!search

  return (
    <main className="min-h-screen bg-zinc-950 pt-16">

      {/* â”€â”€ Hero â”€â”€ */}
      <section className="relative overflow-hidden">
        {/* Grid bg */}
        <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: 'linear-gradient(to right,#27272a 1px,transparent 1px),linear-gradient(to bottom,#27272a 1px,transparent 1px)', backgroundSize: '48px 48px' }} />
        {/* Glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[700px] h-[400px] rounded-full opacity-20" style={{ background: 'radial-gradient(ellipse,#f97316 0%,transparent 70%)', filter: 'blur(80px)' }} />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-full mb-5">
              <Zap className="w-3.5 h-3.5" /> AI/ML Courses by Aman Chauhan
            </span>
            <h1 className="text-4xl sm:text-6xl font-black text-zinc-100 leading-[1.1] mb-5">
              Learn AI & ML<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">The Right Way</span>
            </h1>
            <p className="text-lg text-zinc-400 max-w-xl mx-auto mb-8">
              Structured, production-focused courses on LLMs, RAG, Agents and more. Buy once, access forever.
            </p>

            {/* Search bar */}
            <div className="relative max-w-lg mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="text"
                placeholder="Search courses, topicsâ€¦"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-zinc-900/90 border border-zinc-700 focus:border-orange-500/70 rounded-2xl pl-12 pr-12 py-4 text-zinc-200 placeholder:text-zinc-600 outline-none transition-all text-base shadow-xl shadow-black/30 backdrop-blur-sm"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* â”€â”€ Stats bar â”€â”€ */}
      {!loading && courses.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-y border-zinc-800/60 bg-zinc-900/40 backdrop-blur-sm">
          <div className="max-w-5xl mx-auto px-4 py-5 flex items-center justify-center gap-10 sm:gap-16 flex-wrap">
            {[
              { icon: GraduationCap, val: courses.length.toString(),  label: 'Courses' },
              { icon: Users,         val: totalStudents > 0 ? totalStudents.toLocaleString('en-IN') + '+' : 'â€”', label: 'Students' },
              { icon: Star,          val: avgR > 0 ? avgR.toFixed(1) : 'â€”', label: 'Avg Rating' },
              { icon: Award,         val: 'âˆž',   label: 'Lifetime Access' },
            ].map(({ icon: Icon, val, label }) => (
              <div key={label} className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-orange-400" />
                </div>
                <div>
                  <p className="text-lg font-black text-zinc-100 leading-none">{val}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* â”€â”€ Filters â”€â”€ */}
      <div className="sticky top-16 z-30 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center gap-3 flex-wrap">
          <span className="text-xs font-bold text-zinc-600 uppercase tracking-widest shrink-0">Level:</span>
          {LEVELS.map(l => (
            <button key={l} onClick={() => setLevel(l)}
              className={`px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all ${level === l ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'}`}>
              {l}
            </button>
          ))}
          <span className="text-zinc-700 mx-1">|</span>
          <span className="text-xs font-bold text-zinc-600 uppercase tracking-widest shrink-0">Price:</span>
          {PRICE_OPTS.map(p => (
            <button key={p} onClick={() => setPrice(p)}
              className={`px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all ${price === p ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'}`}>
              {p}
            </button>
          ))}
          {hasFilters && (
            <button onClick={() => { setSearch(''); setLevel('All'); setPrice('All') }}
              className="ml-auto flex items-center gap-1.5 text-xs text-zinc-500 hover:text-orange-400 transition-colors">
              <X className="w-3.5 h-3.5" /> Clear all
            </button>
          )}
        </div>
      </div>

      {/* â”€â”€ Grid â”€â”€ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6 text-center">
            <div className="w-24 h-24 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <GraduationCap className="w-12 h-12 text-zinc-700" />
            </div>
            <div>
              <p className="text-xl font-bold text-zinc-300">
                {courses.length === 0 ? 'Courses launching soon' : 'No courses match'}
              </p>
              <p className="text-zinc-600 text-sm mt-1.5 max-w-xs">
                {courses.length === 0
                  ? 'Aman is recording. Join the waitlist to be first.'
                  : 'Try different filters or clear your search.'}
              </p>
            </div>
            {courses.length === 0 ? (
              <Link href="/connect-aman" className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-bold px-6 py-3 rounded-xl transition-colors">
                Join Waitlist <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <button onClick={() => { setSearch(''); setLevel('All'); setPrice('All') }}
                className="text-sm text-orange-400 hover:text-orange-300 underline underline-offset-2">
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-zinc-500">
                Showing <span className="text-zinc-300 font-bold">{filtered.length}</span> of <span className="text-zinc-300 font-bold">{courses.length}</span> courses
              </p>
              <div className="flex items-center gap-1.5 text-xs text-zinc-600">
                <TrendingUp className="w-3.5 h-3.5" /> Sorted by popularity
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((c, i) => <CourseCard key={c.id} course={c} i={i} />)}
            </div>
          </>
        )}
      </section>
    </main>
  )
}
