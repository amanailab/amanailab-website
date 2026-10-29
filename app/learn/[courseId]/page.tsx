'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  CheckCircle2, Circle, ChevronDown, ChevronUp, PlayCircle,
  ArrowLeft, Loader2, Lock, Menu, X, Award, ChevronRight,
  FileText, BookOpen, Sparkles,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import VideoPlayer from '@/components/courses/VideoPlayer'

type Lecture = {
  id: string; title: string; description: string | null
  video_url: string | null; duration_minutes: number | null
  is_preview: boolean; position: number
}
type Section = { id: string; title: string; position: number; lectures: Lecture[] }
type Course  = { id: string; title: string; slug: string; thumbnail_url: string | null }

const TABS = ['Video', 'Notes', 'Overview'] as const
type Tab = typeof TABS[number]

export default function ClassroomPage() {
  const { courseId } = useParams() as { courseId: string }
  const router       = useRouter()

  const [course, setCourse]        = useState<Course | null>(null)
  const [sections, setSections]    = useState<Section[]>([])
  const [lecture, setLecture]      = useState<Lecture | null>(null)
  const [completed, setCompleted]  = useState<Set<string>>(new Set())
  const [userId, setUserId]        = useState<string | null>(null)
  const [loading, setLoading]      = useState(true)
  const [sidebar, setSidebar]      = useState(true)
  const [expanded, setExpanded]    = useState<Set<string>>(new Set())
  const [tab, setTab]              = useState<Tab>('Video')
  const [notes, setNotes]          = useState<Record<string, string>>({})
  const [notesSaved, setNotesSaved] = useState(false)

  useEffect(() => {
    if (!courseId) return
    const sb = createClient()
    async function load() {
      const { data: { user } } = await sb.auth.getUser()
      if (!user) { router.push('/login?redirect=/learn/' + courseId); return }
      setUserId(user.id)

      const { data: enroll } = await sb.from('enrollments').select('id').eq('user_id', user.id).eq('course_id', courseId).maybeSingle()
      if (!enroll) { router.push('/courses'); return }

      const { data: c } = await sb.from('courses').select('id,title,slug,thumbnail_url').eq('id', courseId).single()
      if (!c) { router.push('/courses'); return }
      setCourse(c as Course)

      const { data: secs } = await sb
        .from('course_sections')
        .select('id,title,position,course_lectures(id,title,description,video_url,duration_minutes,is_preview,position)')
        .eq('course_id', courseId).order('position')
      const norm = (secs ?? []).map((s: Record<string, unknown>) => ({
        ...s, lectures: ((s.course_lectures as Lecture[]) ?? []).sort((a, b) => a.position - b.position),
      })) as Section[]
      setSections(norm)
      setExpanded(new Set(norm.map(s => s.id)))
      if (norm[0]?.lectures[0]) setLecture(norm[0].lectures[0])

      const { data: prog } = await sb.from('lecture_progress').select('lecture_id').eq('user_id', user.id)
      setCompleted(new Set((prog ?? []).map((p: { lecture_id: string }) => p.lecture_id)))

      // Load notes from localStorage
      try {
        const saved = JSON.parse(localStorage.getItem(`notes-${courseId}`) ?? '{}')
        setNotes(saved)
      } catch { /* ignore */ }

      setLoading(false)
    }
    load()
  }, [courseId, router])

  const markComplete = useCallback(async (lectureId: string) => {
    if (!userId || completed.has(lectureId)) return
    const sb = createClient()
    await sb.from('lecture_progress').insert({ user_id: userId, lecture_id: lectureId })
    setCompleted(prev => new Set([...prev, lectureId]))
  }, [userId, completed])

  function saveNote(lectureId: string, text: string) {
    const updated = { ...notes, [lectureId]: text }
    setNotes(updated)
    localStorage.setItem(`notes-${courseId}`, JSON.stringify(updated))
    setNotesSaved(true)
    setTimeout(() => setNotesSaved(false), 2000)
  }

  const allLectures  = sections.flatMap(s => s.lectures)
  const totalLec     = allLectures.length
  const pct          = totalLec > 0 ? Math.round((completed.size / totalLec) * 100) : 0
  const currentIdx   = lecture ? allLectures.findIndex(l => l.id === lecture.id) : -1
  const nextLecture  = allLectures[currentIdx + 1] ?? null

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin mx-auto mb-3" />
        <p className="text-zinc-500 text-sm">Loading your course…</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col" style={{ height: '100dvh' }}>

      {/* ── Top bar ── */}
      <header className="h-14 bg-zinc-900 border-b border-zinc-800 flex items-center gap-3 px-4 shrink-0 z-40">
        <button onClick={() => setSidebar(!sidebar)} className="text-zinc-400 hover:text-zinc-100 transition-colors p-1">
          {sidebar ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <Link href="/courses" className="flex items-center gap-1.5 text-zinc-500 hover:text-orange-400 transition-colors text-sm shrink-0">
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Courses</span>
        </Link>
        <span className="text-zinc-700">·</span>
        <span className="text-sm font-semibold text-zinc-300 truncate flex-1 min-w-0">{course?.title}</span>

        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-28 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs font-bold text-zinc-400">{pct}%</span>
          </div>
          {pct === 100 && (
            <Link href={`/certificate/${courseId}`}
              className="flex items-center gap-1.5 text-xs bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1.5 rounded-full hover:bg-amber-500/20 transition-colors">
              <Award className="w-3.5 h-3.5" /> Certificate
            </Link>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar ── */}
        {sidebar && (
          <aside className="w-72 bg-zinc-900 border-r border-zinc-800 flex flex-col shrink-0 overflow-y-auto scrollbar-hide">

            {/* Progress summary */}
            <div className="p-4 border-b border-zinc-800 bg-zinc-950/50">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Progress</p>
                <span className="text-xs font-bold text-orange-400">{completed.size}/{totalLec} done</span>
              </div>
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
              </div>
            </div>

            {/* Sections */}
            <div className="flex-1 py-2">
              {sections.map((sec, si) => {
                const isOpen   = expanded.has(sec.id)
                const secDone  = sec.lectures.filter(l => completed.has(l.id)).length
                return (
                  <div key={sec.id}>
                    <button
                      onClick={() => setExpanded(prev => { const n = new Set(prev); n.has(sec.id) ? n.delete(sec.id) : n.add(sec.id); return n })}
                      className="w-full flex items-start gap-2 px-4 py-3 hover:bg-zinc-800/50 transition-colors text-left">
                      <div className="mt-0.5 shrink-0">
                        {isOpen ? <ChevronUp className="w-4 h-4 text-zinc-600" /> : <ChevronDown className="w-4 h-4 text-zinc-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-zinc-200 leading-snug">{si + 1}. {sec.title}</p>
                        <p className="text-xs text-zinc-600 mt-0.5">{secDone}/{sec.lectures.length} completed</p>
                      </div>
                    </button>

                    {isOpen && sec.lectures.map((l, li) => {
                      const isActive = lecture?.id === l.id
                      const isDone   = completed.has(l.id)
                      return (
                        <button key={l.id} onClick={() => { setLecture(l); setTab('Video') }}
                          className={`w-full flex items-start gap-3 pl-10 pr-4 py-2.5 text-left transition-colors border-l-2 ${
                            isActive
                              ? 'bg-orange-500/8 border-orange-500'
                              : 'hover:bg-zinc-800/40 border-transparent'
                          }`}>
                          <div className="mt-0.5 shrink-0">
                            {isDone
                              ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              : isActive
                                ? <PlayCircle className="w-4 h-4 text-orange-400" />
                                : <Circle className="w-4 h-4 text-zinc-700" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-[13px] leading-snug line-clamp-2 ${
                              isActive ? 'text-orange-300 font-semibold' : isDone ? 'text-zinc-500' : 'text-zinc-300'
                            }`}>
                              {li + 1}. {l.title}
                            </p>
                            {l.duration_minutes && (
                              <p className="text-xs text-zinc-600 mt-0.5">{Math.round(l.duration_minutes)}m</p>
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

        {/* ── Main ── */}
        <main className="flex-1 overflow-y-auto bg-zinc-950">
          {lecture ? (
            <div className="max-w-5xl mx-auto px-0 sm:px-4 lg:px-8 py-0 sm:py-6">

              {/* Video player */}
              <div className="aspect-video bg-zinc-900 rounded-none sm:rounded-2xl overflow-hidden border-0 sm:border border-zinc-800 shadow-2xl shadow-black/40">
                {lecture.video_url ? (
                  <VideoPlayer url={lecture.video_url} title={lecture.title} thumbnail={course?.thumbnail_url} autoplay={false} />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-zinc-900">
                    <Lock className="w-12 h-12 text-zinc-700" />
                    <p className="text-zinc-500 text-sm">No video for this lecture</p>
                  </div>
                )}
              </div>

              {/* Tabs */}
              <div className="px-4 sm:px-0 mt-4">
                <div className="flex items-center gap-1 border-b border-zinc-800 mb-4">
                  {TABS.map(t => (
                    <button key={t} onClick={() => setTab(t)}
                      className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 ${
                        tab === t
                          ? 'text-orange-400 border-orange-500'
                          : 'text-zinc-500 border-transparent hover:text-zinc-300'
                      }`}>
                      {t === 'Video' && <PlayCircle className="w-4 h-4" />}
                      {t === 'Notes' && <FileText className="w-4 h-4" />}
                      {t === 'Overview' && <BookOpen className="w-4 h-4" />}
                      {t}
                    </button>
                  ))}
                </div>

                {/* Tab: Video info + actions */}
                {tab === 'Video' && (
                  <div className="space-y-5 pb-10">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <h1 className="text-xl font-bold text-zinc-100">{lecture.title}</h1>
                        {lecture.duration_minutes && (
                          <p className="text-sm text-zinc-500 mt-1">{Math.round(lecture.duration_minutes)} minutes</p>
                        )}
                      </div>
                      <button onClick={() => markComplete(lecture.id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shrink-0 ${
                          completed.has(lecture.id)
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-orange-500 hover:bg-orange-400 text-white shadow-lg shadow-orange-500/20'
                        }`}>
                        {completed.has(lecture.id)
                          ? <><CheckCircle2 className="w-4 h-4" /> Completed</>
                          : <><Circle className="w-4 h-4" /> Mark Complete</>}
                      </button>
                    </div>

                    {lecture.description && (
                      <p className="text-zinc-400 text-sm leading-relaxed">{lecture.description}</p>
                    )}

                    {/* Next lecture */}
                    {nextLecture && (
                      <div className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
                        <div>
                          <p className="text-xs text-zinc-600 mb-1">Next up</p>
                          <p className="text-sm font-semibold text-zinc-300 line-clamp-1">{nextLecture.title}</p>
                        </div>
                        <button
                          onClick={() => { markComplete(lecture.id); setLecture(nextLecture); setTab('Video') }}
                          className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-zinc-100 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shrink-0">
                          Next <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab: Notes */}
                {tab === 'Notes' && (
                  <div className="space-y-4 pb-10">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-base font-bold text-zinc-100">My Notes</h2>
                        <p className="text-xs text-zinc-600 mt-0.5">Notes are saved locally on your device</p>
                      </div>
                      {notesSaved && (
                        <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Saved
                        </span>
                      )}
                    </div>
                    <textarea
                      value={notes[lecture.id] ?? ''}
                      onChange={e => saveNote(lecture.id, e.target.value)}
                      placeholder={`Take notes for "${lecture.title}"…\n\nYour notes are saved automatically as you type.`}
                      className="w-full h-72 bg-zinc-900 border border-zinc-800 focus:border-orange-500/60 rounded-xl p-4 text-zinc-300 placeholder:text-zinc-700 text-sm leading-relaxed outline-none transition-colors resize-none"
                    />
                    <div className="flex items-start gap-2 text-xs text-zinc-600">
                      <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5 text-orange-500/50" />
                      Tip: Use notes to write key takeaways, code snippets, or questions to revisit later.
                    </div>
                  </div>
                )}

                {/* Tab: Overview */}
                {tab === 'Overview' && (
                  <div className="space-y-6 pb-10">
                    <div>
                      <h2 className="text-base font-bold text-zinc-100 mb-3">About This Lecture</h2>
                      {lecture.description
                        ? <p className="text-zinc-400 text-sm leading-relaxed">{lecture.description}</p>
                        : <p className="text-zinc-600 text-sm">No description provided for this lecture.</p>}
                    </div>
                    <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
                      <h3 className="text-sm font-bold text-zinc-300 mb-3">Course Progress</h3>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-sm font-bold text-orange-400">{pct}%</span>
                      </div>
                      <p className="text-xs text-zinc-500">{completed.size} of {totalLec} lectures completed</p>
                      {pct === 100 && (
                        <Link href={`/certificate/${courseId}`}
                          className="mt-3 flex items-center justify-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-amber-500/20 transition-colors">
                          <Award className="w-4 h-4" /> Get Your Certificate
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-80 gap-4">
              <PlayCircle className="w-20 h-20 text-zinc-800" />
              <p className="text-zinc-500 text-sm">Select a lecture from the sidebar to start learning</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
