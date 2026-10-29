'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { GraduationCap, Clock, Users, Star, ArrowRight, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Course = {
  id: string; slug: string; title: string; short_description: string | null
  thumbnail_url: string | null; price: number; is_free: boolean
  level: string; duration_hours: number | null; students_count: number; rating: number
}

function CourseCard({ course, index }: { course: Course; index: number }) {
  const levelColor = {
    beginner: 'text-emerald-400', intermediate: 'text-blue-400', advanced: 'text-orange-400',
  }[course.level] ?? 'text-zinc-400'

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.08 }}>
      <Link href={`/courses/${course.slug}`} className="group flex flex-col bg-zinc-900 border border-zinc-800 hover:border-orange-500/40 rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-500/5">
        <div className="relative aspect-video bg-zinc-800 overflow-hidden">
          {course.thumbnail_url ? (
            <Image src={course.thumbnail_url} alt={course.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-500/20 to-zinc-900">
              <GraduationCap className="w-12 h-12 text-orange-500/40" />
            </div>
          )}
          {course.is_free && (
            <span className="absolute top-3 left-3 text-[10px] font-black uppercase px-2 py-1 bg-emerald-500 text-white rounded-full">Free</span>
          )}
        </div>
        <div className="p-5 flex flex-col gap-2.5 flex-1">
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-bold uppercase tracking-widest ${levelColor}`}>{course.level}</span>
            {course.duration_hours && <span className="flex items-center gap-1 text-xs text-zinc-600"><Clock className="w-3 h-3" />{course.duration_hours}h</span>}
          </div>
          <h3 className="font-bold text-zinc-100 text-sm leading-snug group-hover:text-orange-400 transition-colors line-clamp-2">{course.title}</h3>
          {course.short_description && <p className="text-xs text-zinc-500 line-clamp-2">{course.short_description}</p>}
          <div className="mt-auto flex items-center justify-between pt-3 border-t border-zinc-800">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              {course.rating > 0 && (
                <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400 fill-amber-400" />{course.rating.toFixed(1)}</span>
              )}
              <span className="flex items-center gap-1"><Users className="w-3 h-3" />{course.students_count}</span>
            </div>
            <span className={`font-black text-base ${course.is_free ? 'text-emerald-400' : 'text-orange-400'}`}>
              {course.is_free ? 'Free' : `₹${course.price.toLocaleString('en-IN')}`}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default function CoursesSection() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loaded, setLoaded]   = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('courses')
      .select('id,slug,title,short_description,thumbnail_url,price,is_free,level,duration_hours,students_count,rating')
      .eq('is_published', true)
      .order('students_count', { ascending: false })
      .limit(4)
      .then(({ data }) => { setCourses((data as Course[]) ?? []); setLoaded(true) })
  }, [])

  if (loaded && courses.length === 0) return null

  return (
    <section className="py-16 sm:py-20 border-t border-zinc-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center gap-1.5 text-xs font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-full">
                <Zap className="w-3.5 h-3.5" /> Courses
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-100">Learn AI/ML Deeply</h2>
            <p className="text-zinc-500 mt-2 text-sm max-w-md">Structured video courses with hands-on projects. Buy once, access forever.</p>
          </div>
          <Link href="/courses" className="hidden sm:flex items-center gap-1.5 text-sm text-orange-400 hover:text-orange-300 transition-colors font-semibold shrink-0">
            All courses <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {!loaded ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-video bg-zinc-800" />
                <div className="p-5 space-y-2.5">
                  <div className="h-3 bg-zinc-800 rounded w-1/4" />
                  <div className="h-4 bg-zinc-800 rounded w-3/4" />
                  <div className="h-3 bg-zinc-800 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {courses.map((c, i) => <CourseCard key={c.id} course={c} index={i} />)}
          </div>
        )}

        <div className="mt-8 flex justify-center sm:hidden">
          <Link href="/courses" className="flex items-center gap-2 text-sm text-orange-400 border border-orange-500/30 hover:border-orange-500/60 px-5 py-2.5 rounded-xl transition-colors">
            View all courses <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
