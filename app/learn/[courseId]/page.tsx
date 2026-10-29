'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  CheckCircle2, Circle, ChevronDown, ChevronUp, PlayCircle,
  ArrowLeft, Loader2, Lock, Menu, X, Award,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Lecture = {
  id: string
  title: string
  description: string | null
  video_url: string | null
  duration_minutes: number | null
  is_preview: boolean
  position: number
}

type Section = {
  id: string
  title: string
  position: number
  lectures: Lecture[]
}

type Course = {
  id: string
  title: string
  slug: string
}

function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v')
      if (v) return `https://www.youtube.com/embed/${v}?rel=0&modestbranding=1`
    }
    if (u.hostname === 'youtu.be') {
      return `https://www.youtube.com/embed${u.pathname}?rel=0&modestbranding=1`
    }
    // raw embed URL passed directly
    if (url.includes('youtube.com/embed/')) return url
  } catch { /* not a URL */ }
  return null
}

export default function ClassroomPage() {
  const params   = useParams()
  const router   = useRouter()
  const courseId = params?.courseId as string

  const [course, setCourse]         = useState<Course | null>(null)
  const [sections, setSections]     = useState<Section[]>([])
  const [activeLecture, setActive]  = useState<Lecture | null>(null)
  const [completed, setCompleted]   = useState<Set<string>>(new Set())
  const [userId, setUserId]         = useState<string | null>(null)
  const [loading, setLoading]       = useState(true)
  const [sidebarOpen, setSidebar]   = useState(true)
  const [expandedSections, setExp]  = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!courseId) return
    const supabase = createClient()

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login?redirect=/learn/' + courseId); return }
      setUserId(user.id)

      // Check enrollment
      const { data: enroll } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .maybeSingle()

      if (!enroll) { router.push('/courses'); return }

      // Load course
      const { data: courseData } = await supabase
        .from('courses')
        .select('id,title,slug')
        .eq('id', courseId)
        .single()
      if (!courseData) { router.push('/courses'); return }
      setCourse(courseData as Course)

      // Load sections + lectures
      const { data: sectionsData } = await supabase
        .from('course_sections')
        .select('id,title,position,course_lectures(id,title,description,video_url,duration_minutes,is_preview,position)')
        .eq('course_id', courseId)
        .order('position')

      const normalized = (sectionsData ?? []).map((s: Record<string, unknown>) => ({
        ...s,
        lectures: ((s.course_lectures as Lecture[]) ?? []).sort((a, b) => a.position - b.position),
      })) as Section[]
      setSections(normalized)

      // Expand all sections by default
      setExp(new Set(normalized.map(s => s.id)))

      // Auto-select first lecture
      const firstLecture = normalized[0]?.lectures[0]
      if (firstLecture) setActive(firstLecture)

      // Load progress
      const { data: progress } = await supabase
        .from('lecture_progress')
        .select('lecture_id')
        .eq('user_id', user.id)
      setCompleted(new Set((progress ?? []).map((p: { lecture_id: string }) => p.lecture_id)))

      setLoading(false)
    }

    load()
  }, [courseId, router])

  const markComplete = useCallback(async (lectureId: string) => {
    if (!userId || completed.has(lectureId)) return
    const supabase = createClient()
    await supabase.from('lecture_progress').insert({ user_id: userId, lecture_id: lectureId })
    setCompleted(prev => new Set([...prev, lectureId]))
  }, [userId, completed])

  const totalLectures   = sections.reduce((acc, s) => acc + s.lectures.length, 0)
  const progressPercent = totalLectures > 0 ? Math.round((completed.size / totalLectures) * 100) : 0
  const embedUrl        = activeLecture?.video_url ? getYouTubeEmbedUrl(activeLecture.video_url) : null

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">

      {/* Top bar */}
      <header className="h-14 bg-zinc-900 border-b border-zinc-800 flex items-center px-4 gap-3 shrink-0 z-40">
        <button onClick={() => setSidebar(!sidebarOpen)} className="text-zinc-400 hover:text-zinc-100 transition-colors">
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <Link href="/courses" className="flex items-center gap-1.5 text-zinc-500 hover:text-orange-400 transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" /> Courses
        </Link>
        <span className="text-zinc-700">·</span>
        <span className="text-sm font-semibold text-zinc-300 truncate flex-1">{course?.title}</span>

        {/* Progress bar */}
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          <div className="w-32 h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
          </div>
          <span className="text-xs text-zinc-400 font-semibold">{progressPercent}%</span>
          {progressPercent === 100 && (
            <Link href={`/certificate/${courseId}`} className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full hover:bg-amber-500/20 transition-colors">
              <Award className="w-3.5 h-3.5" /> Get Certificate
            </Link>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="w-80 bg-zinc-900 border-r border-zinc-800 flex flex-col shrink-0 overflow-y-auto">
            <div className="p-4 border-b border-zinc-800">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Your Progress</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
                </div>
                <span className="text-xs font-bold text-zinc-400">{completed.size}/{totalLectures}</span>
              </div>
            </div>

            <div className="flex-1 py-2">
              {sections.map(section => {
                const isOpen = expandedSections.has(section.id)
                return (
                  <div key={section.id}>
                    <button
                      onClick={() => setExp(prev => { const n = new Set(prev); n.has(section.id) ? n.delete(section.id) : n.add(section.id); return n })}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-800/50 transition-colors text-left">
                      <div>
                        <p className="text-sm font-semibold text-zinc-200">{section.title}</p>
                        <p className="text-xs text-zinc-600 mt-0.5">{section.lectures.length} lectures</p>
                      </div>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-zinc-600 shrink-0" /> : <ChevronDown className="w-4 h-4 text-zinc-600 shrink-0" />}
                    </button>

                    {isOpen && section.lectures.map(lecture => {
                      const isActive = activeLecture?.id === lecture.id
                      const isDone   = completed.has(lecture.id)
                      return (
                        <button key={lecture.id} onClick={() => setActive(lecture)}
                          className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors ${isActive ? 'bg-orange-500/10 border-l-2 border-orange-500' : 'hover:bg-zinc-800/40 border-l-2 border-transparent'}`}>
                          <div className="mt-0.5 shrink-0">
                            {isDone
                              ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              : isActive
                                ? <PlayCircle className="w-4 h-4 text-orange-400" />
                                : <Circle className="w-4 h-4 text-zinc-600" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm leading-snug truncate ${isActive ? 'text-orange-300 font-semibold' : isDone ? 'text-zinc-400' : 'text-zinc-300'}`}>
                              {lecture.title}
                            </p>
                            {lecture.duration_minutes && (
                              <p className="text-xs text-zinc-600 mt-0.5">{Math.round(lecture.duration_minutes)} min</p>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </aside>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-zinc-950">
          {activeLecture ? (
            <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

              {/* Video player */}
              <div className="aspect-video bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800">
                {embedUrl ? (
                  <iframe src={embedUrl} title={activeLecture.title} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                    <Lock className="w-10 h-10 text-zinc-600" />
                    <p className="text-zinc-500 text-sm">No video available for this lecture</p>
                  </div>
                )}
              </div>

              {/* Lecture info */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-xl font-bold text-zinc-100">{activeLecture.title}</h1>
                  {activeLecture.description && (
                    <p className="text-zinc-400 text-sm mt-2 leading-relaxed">{activeLecture.description}</p>
                  )}
                </div>
                <button onClick={() => markComplete(activeLecture.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors shrink-0 ${
                    completed.has(activeLecture.id)
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-orange-500 hover:bg-orange-400 text-white'
                  }`}>
                  {completed.has(activeLecture.id)
                    ? <><CheckCircle2 className="w-4 h-4" /> Completed</>
                    : <><Circle className="w-4 h-4" /> Mark Complete</>}
                </button>
              </div>

              {/* Next lecture */}
              {(() => {
                const allLectures = sections.flatMap(s => s.lectures)
                const idx = allLectures.findIndex(l => l.id === activeLecture.id)
                const next = allLectures[idx + 1]
                if (!next) return null
                return (
                  <div className="border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Up next</p>
                      <p className="text-sm font-semibold text-zinc-300">{next.title}</p>
                    </div>
                    <button onClick={() => { markComplete(activeLecture.id); setActive(next) }}
                      className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium px-4 py-2.5 rounded-xl transition-colors">
                      Next <PlayCircle className="w-4 h-4" />
                    </button>
                  </div>
                )
              })()}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-32 gap-4">
              <PlayCircle className="w-16 h-16 text-zinc-700" />
              <p className="text-zinc-400">Select a lecture from the sidebar to start learning</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
