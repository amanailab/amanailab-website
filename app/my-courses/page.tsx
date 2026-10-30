'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { GraduationCap, PlayCircle, Award, Loader2, ArrowLeft, Compass } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type MyCourse = {
  id: string; slug: string; title: string; thumbnail_url: string | null; level: string
  total: number; completed: number; percent: number; continueLectureId: string | null
}

export default function MyCoursesPage() {
  const router = useRouter()
  const [courses, setCourses] = useState<MyCourse[] | null>(null)
  const [error, setError]     = useState(false)

  useEffect(() => {
    let dead = false
    ;(async () => {
      const { data: { user } } = await createClient().auth.getUser()
      if (!user) { router.replace('/login?redirect=/my-courses'); return }
      const r = await fetch('/api/my-courses')
      if (dead) return
      if (!r.ok) { setError(true); return }
      setCourses((await r.json()).courses)
    })()
    return () => { dead = true }
  }, [router])

  return (
    <main className="min-h-screen bg-zinc-950 pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/courses" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-orange-400 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Browse all courses
        </Link>
        <h1 className="text-3xl font-black text-zinc-100 mb-8">My Courses</h1>

        {error ? (
          <p className="text-zinc-400">Could not load your courses. <button className="text-orange-400 underline" onClick={() => location.reload()}>Retry</button></p>
        ) : courses === null ? (
          <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 text-orange-500 animate-spin" /></div>
        ) : courses.length === 0 ? (
          <div className="flex flex-col items-center gap-5 py-24 text-center">
            <div className="w-24 h-24 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <GraduationCap className="w-12 h-12 text-zinc-700" />
            </div>
            <p className="text-zinc-300 font-semibold">You haven&apos;t enrolled in any course yet</p>
            <Link href="/courses" className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-bold px-6 py-3 rounded-xl transition-colors">
              <Compass className="w-4 h-4" /> Explore courses
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map(c => {
              const finished = c.total > 0 && c.completed >= c.total
              const href = `/learn/${c.id}${c.continueLectureId ? `?lecture=${c.continueLectureId}` : ''}`
              return (
                <div key={c.id} className="flex flex-col bg-zinc-900 border border-zinc-800 hover:border-orange-500/40 rounded-2xl overflow-hidden transition-colors">
                  <Link href={href} className="relative aspect-video bg-zinc-800 block group">
                    {c.thumbnail_url
                      ? <Image src={c.thumbnail_url} alt={c.title} fill sizes="(max-width:768px) 100vw, 33vw" unoptimized className="object-cover" />
                      : <div className="absolute inset-0 flex items-center justify-center"><GraduationCap className="w-14 h-14 text-orange-500/25" /></div>}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-colors">
                      <PlayCircle className="w-14 h-14 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                  <div className="p-5 flex flex-col gap-3 flex-1">
                    <Link href={`/courses/${c.slug}`} className="font-bold text-zinc-100 leading-snug line-clamp-2 hover:text-orange-400 transition-colors">{c.title}</Link>
                    <div>
                      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-orange-500 to-orange-400" style={{ width: `${c.percent}%` }} />
                      </div>
                      <p className="text-xs text-zinc-500 mt-1.5">{c.completed}/{c.total} lectures · {c.percent}%</p>
                    </div>
                    <div className="flex gap-2 mt-auto">
                      <Link href={href} className="flex-1 text-center bg-orange-500 hover:bg-orange-400 text-white font-bold py-2.5 rounded-xl text-sm transition-colors">
                        {c.completed === 0 ? 'Start' : finished ? 'Review' : 'Continue'}
                      </Link>
                      {finished && (
                        <Link href={`/certificate/${c.id}`} className="flex items-center gap-1.5 px-3.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl text-sm font-semibold hover:bg-amber-500/20 transition-colors">
                          <Award className="w-4 h-4" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
