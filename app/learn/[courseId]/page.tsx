'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  CheckCircle2, Circle, ChevronDown, ChevronUp, PlayCircle, ArrowLeft, Loader2,
  Menu, X, Award, ChevronRight, ChevronLeft, FileText, BookOpen, Sparkles, Star,
  LayoutGrid, Zap,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import VideoPlayer from '@/components/courses/VideoPlayer'
import { fireAchievementConfetti } from '@/lib/confetti'

type Lecture = {
  id: string; title: string; description: string | null
  duration_minutes: number | null; is_preview: boolean; position: number; has_video: boolean
}
type Section = { id: string; title: string; position: number; lectures: Lecture[] }
type Course  = { id: string; title: string; slug: string; thumbnail_url: string | null; description: string | null }
type Payload = {
  course: Course; sections: Section[]; completed: string[]; notes: Record<string, string>
  positions: Record<string, number>; lastLectureId: string | null; email: string | null
  review: { rating: number; review_text: string | null } | null
}

const TABS = ['Lecture', 'Notes', 'Overview'] as const
type Tab = typeof TABS[number]

export default function ClassroomPage() {
  const { courseId } = useParams() as { courseId: string }
  const router       = useRouter()

  const [data, setData]            = useState<Payload | null>(null)
  const [error, setError]          = useState<string | null>(null)
  const [lectureId, setLectureId]  = useState<string | null>(null)
  const [completed, setCompleted]  = useState<Set<string>>(new Set())
  const [sidebar, setSidebar]      = useState(false)
  const [expanded, setExpanded]    = useState<Set<string>>(new Set())
  const [tab, setTab]              = useState<Tab>('Lecture')
  const [notes, setNotes]          = useState<Record<string, string>>({})
  const [notesState, setNotesState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [autoNext, setAutoNext]    = useState(true)
  const [toast, setToast]          = useState<string | null>(null)
  const [autoplayNow, setAutoplayNow] = useState(false)
  const [rating, setRating]        = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [reviewSaved, setReviewSaved] = useState(false)

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastPosSent = useRef(0)
  const userIdRef = useRef<string | null>(null)

  const flash = useCallback((msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500) }, [])

  // ── Load classroom ──
  useEffect(() => {
    if (!courseId) return
    let dead = false
    ;(async () => {
      const sb = createClient()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) { router.replace('/login?redirect=/learn/' + courseId); return }
      userIdRef.current = user.id

      const res = await fetch(`/api/learn/${courseId}`)
      if (dead) return
      if (res.status === 401) { router.replace('/login?redirect=/learn/' + courseId); return }
      if (res.status === 403) {
        // Not enrolled — send them to the course page so they can enrol (not a dead end)
        const { data: c } = await sb.from('courses').select('slug').eq('id', courseId).maybeSingle()
        router.replace(c?.slug ? `/courses/${c.slug}` : '/courses'); return
      }
      if (!res.ok) { setError('Could not load this course. Please try again.'); return }

      const d = (await res.json()) as Payload
      setData(d)
      setCompleted(new Set(d.completed))
      setExpanded(new Set(d.sections.map(s => s.id)))

      // Local fallback notes merged under server notes
      let local: Record<string, string> = {}
      try { local = JSON.parse(localStorage.getItem(`notes-${courseId}`) ?? '{}') } catch { /* ignore */ }
      setNotes({ ...local, ...d.notes })

      try { setAutoNext(localStorage.getItem('autoplay-next') !== '0') } catch { /* ignore */ }
      if (d.review) { setRating(d.review.rating); setReviewText(d.review.review_text ?? ''); setReviewSaved(true) }

      // Deep link > last watched > first unfinished > first lecture
      const all = d.sections.flatMap(s => s.lectures)
      const fromUrl = new URLSearchParams(window.location.search).get('lecture')
      const done = new Set(d.completed)
      const start =
        all.find(l => l.id === fromUrl) ??
        all.find(l => l.id === d.lastLectureId) ??
        all.find(l => !done.has(l.id)) ?? all[0]
      setLectureId(start?.id ?? null)
      setSidebar(window.innerWidth >= 1024)
    })()
    return () => { dead = true }
  }, [courseId, router])

  const sections   = data?.sections ?? []
  const allLectures = sections.flatMap(s => s.lectures)
  const totalLec   = allLectures.length
  const doneCount  = allLectures.filter(l => completed.has(l.id)).length
  const pct        = totalLec > 0 ? Math.round((doneCount / totalLec) * 100) : 0
  const currentIdx = allLectures.findIndex(l => l.id === lectureId)
  const lecture    = currentIdx >= 0 ? allLectures[currentIdx] : null
  const prevLecture = currentIdx > 0 ? allLectures[currentIdx - 1] : null
  const nextLecture = currentIdx >= 0 ? allLectures[currentIdx + 1] ?? null : null

  const openLecture = useCallback((id: string, play = false) => {
    setAutoplayNow(play); setLectureId(id); setTab('Lecture'); lastPosSent.current = 0
    window.history.replaceState(null, '', `?lecture=${id}`)
    // make sure its section is open, close the drawer on mobile
    const sec = sections.find(s => s.lectures.some(l => l.id === id))
    if (sec) setExpanded(prev => new Set(prev).add(sec.id))
    if (window.innerWidth < 1024) setSidebar(false)
  }, [sections])

  const setDone = useCallback(async (id: string, value: boolean) => {
    const before = completed
    const next = new Set(before)
    value ? next.add(id) : next.delete(id)
    setCompleted(next) // optimistic
    try {
      const r = await fetch('/api/learn/progress', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lectureId: id, completed: value }),
      })
      if (!r.ok) throw new Error()
      if (value && totalLec > 0 && next.size >= totalLec && !before.has(id)) {
        fireAchievementConfetti(); flash('🎉 Course complete! Your certificate is ready.')
      }
    } catch {
      setCompleted(before)
      flash('Could not save progress — check your connection.')
    }
  }, [completed, totalLec, flash])

  const onVideoEnded = useCallback(() => {
    if (!lecture) return
    if (!completed.has(lecture.id)) setDone(lecture.id, true)
    if (autoNext && nextLecture) setTimeout(() => openLecture(nextLecture.id, true), 1200)
  }, [lecture, completed, setDone, autoNext, nextLecture, openLecture])

  const onVideoProgress = useCallback((sec: number) => {
    if (!lectureId) return
    const now = Date.now()
    if (now - lastPosSent.current < 8000) return
    lastPosSent.current = now
    fetch('/api/learn/progress', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true,
      body: JSON.stringify({ lectureId, position: sec }),
    }).catch(() => {})
  }, [lectureId])

  // ── Keyboard: N next, P previous ──
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement
      if (t.tagName === 'TEXTAREA' || t.tagName === 'INPUT' || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'n' && nextLecture) openLecture(nextLecture.id)
      if (e.key === 'p' && prevLecture) openLecture(prevLecture.id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [nextLecture, prevLecture, openLecture])

  function saveNote(id: string, text: string) {
    const updated = { ...notes, [id]: text }
    setNotes(updated)
    try { localStorage.setItem(`notes-${courseId}`, JSON.stringify(updated)) } catch { /* ignore */ }
    setNotesState('saving')
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      if (!userIdRef.current) return
      const { error: e } = await createClient().from('course_notes').upsert(
        { user_id: userIdRef.current, lecture_id: id, content: text },
        { onConflict: 'user_id,lecture_id' }
      )
      setNotesState(e ? 'error' : 'saved')
      if (!e) setTimeout(() => setNotesState('idle'), 2000)
    }, 700)
  }

  async function submitReview() {
    if (!rating) { flash('Pick a star rating first.'); return }
    const r = await fetch('/api/courses/review', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId, rating, text: reviewText }),
    })
    if (r.ok) { setReviewSaved(true); flash('Thanks for your review!') } else flash('Could not save your review.')
  }

  // ── Render ──
  if (error) return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-zinc-300">{error}</p>
      <div className="flex gap-3">
        <button onClick={() => location.reload()} className="px-5 py-2.5 bg-orange-500 hover:bg-orange-400 text-white rounded-xl font-semibold text-sm">Retry</button>
        <Link href="/my-courses" className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl font-semibold text-sm">My Courses</Link>
      </div>
    </div>
  )

  if (!data) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin mx-auto mb-3" />
        <p className="text-zinc-500 text-sm">Loading your course…</p>
      </div>
    </div>
  )

  const course = data.course

  const curriculum = (
    <>
      <div className="p-4 border-b border-zinc-800 bg-zinc-950/50">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Your progress</p>
          <span className="text-xs font-bold text-orange-400">{doneCount}/{totalLec} done</span>
        </div>
        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="flex-1 py-2">
        {sections.map((sec, si) => {
          const isOpen  = expanded.has(sec.id)
          const secDone = sec.lectures.filter(l => completed.has(l.id)).length
          return (
            <div key={sec.id}>
              <button
                onClick={() => setExpanded(prev => { const n = new Set(prev); if (n.has(sec.id)) n.delete(sec.id); else n.add(sec.id); return n })}
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
                const isActive = lectureId === l.id
                const isDone   = completed.has(l.id)
                return (
                  <button key={l.id} onClick={() => openLecture(l.id)}
                    className={`w-full flex items-start gap-3 pl-10 pr-4 py-2.5 text-left transition-colors border-l-2 ${
                      isActive ? 'bg-orange-500/10 border-orange-500' : 'hover:bg-zinc-800/40 border-transparent'}`}>
                    <div className="mt-0.5 shrink-0">
                      {isDone ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        : isActive ? <PlayCircle className="w-4 h-4 text-orange-400" />
                        : <Circle className="w-4 h-4 text-zinc-700" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] leading-snug line-clamp-2 ${isActive ? 'text-orange-300 font-semibold' : isDone ? 'text-zinc-500' : 'text-zinc-300'}`}>
                        {li + 1}. {l.title}
                      </p>
                      {l.duration_minutes ? <p className="text-xs text-zinc-600 mt-0.5">{Math.round(l.duration_minutes)}m</p> : null}
                    </div>
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>
    </>
  )

  return (
    <div className="bg-zinc-950 flex flex-col" style={{ height: '100dvh' }}>

      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[60] bg-zinc-800 border border-zinc-700 text-zinc-100 px-4 py-2.5 rounded-xl shadow-2xl text-sm">
          {toast}
        </div>
      )}

      {/* ── Top bar ── */}
      <header className="h-14 bg-zinc-900 border-b border-zinc-800 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 shrink-0 z-40">
        <Link href="/my-courses" aria-label="Back to my courses"
          className="flex items-center gap-1.5 text-zinc-400 hover:text-orange-400 transition-colors text-sm shrink-0 px-1.5 py-1 rounded-lg hover:bg-zinc-800">
          <ArrowLeft className="w-5 h-5" />
          <span className="hidden sm:inline">My Courses</span>
        </Link>
        <span className="text-zinc-700 hidden sm:inline">·</span>
        <Link href={`/courses/${course.slug}`} className="text-sm font-semibold text-zinc-300 hover:text-orange-400 truncate flex-1 min-w-0 transition-colors">
          {course.title}
        </Link>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="hidden md:flex items-center gap-2">
            <div className="w-28 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs font-bold text-zinc-400">{pct}%</span>
          </div>
          {pct === 100 && (
            <Link href={`/certificate/${courseId}`}
              className="flex items-center gap-1.5 text-xs bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1.5 rounded-full hover:bg-amber-500/20 transition-colors">
              <Award className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Certificate</span>
            </Link>
          )}
          <button onClick={() => setSidebar(s => !s)} aria-label={sidebar ? 'Hide lectures' : 'Show lectures'}
            className="flex items-center gap-1.5 text-zinc-300 hover:text-zinc-100 bg-zinc-800 hover:bg-zinc-700 transition-colors px-3 py-1.5 rounded-lg text-sm">
            {sidebar ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            <span className="hidden sm:inline">Lectures</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">

        {/* ── Main ── */}
        <main className="flex-1 overflow-y-auto bg-zinc-950 order-1">
          {lecture ? (
            <div className="max-w-5xl mx-auto px-0 sm:px-4 lg:px-8 py-0 sm:py-6">

              <div className="aspect-video bg-zinc-900 rounded-none sm:rounded-2xl overflow-hidden border-0 sm:border border-zinc-800 shadow-2xl shadow-black/40">
                {lecture.has_video ? (
                  <VideoPlayer
                    key={lecture.id}
                    lectureId={lecture.id}
                    title={lecture.title}
                    thumbnail={course.thumbnail_url}
                    startAt={data.positions[lecture.id] ?? 0}
                    autoplay={autoplayNow}
                    watermark={data.email}
                    onProgress={onVideoProgress}
                    onEnded={onVideoEnded}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                    <PlayCircle className="w-12 h-12 text-zinc-700" />
                    <p className="text-zinc-500 text-sm">This lecture has no video yet</p>
                  </div>
                )}
              </div>

              {/* Prev / Next bar */}
              <div className="flex items-center gap-2 px-4 sm:px-0 mt-3">
                <button disabled={!prevLecture} onClick={() => prevLecture && openLecture(prevLecture.id)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  <ChevronLeft className="w-4 h-4" /> <span className="hidden sm:inline">Previous</span>
                </button>
                <label className="flex items-center gap-2 text-xs text-zinc-500 cursor-pointer mx-auto select-none">
                  <input type="checkbox" checked={autoNext} className="accent-orange-500"
                    onChange={e => { setAutoNext(e.target.checked); try { localStorage.setItem('autoplay-next', e.target.checked ? '1' : '0') } catch { /* ignore */ } }} />
                  <Zap className="w-3.5 h-3.5 text-orange-500/70" /> Auto-play next
                </label>
                <button disabled={!nextLecture} onClick={() => nextLecture && openLecture(nextLecture.id)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold bg-orange-500 hover:bg-orange-400 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  <span className="hidden sm:inline">Next</span> <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Tabs */}
              <div className="px-4 sm:px-0 mt-4">
                <div className="flex items-center gap-1 border-b border-zinc-800 mb-4">
                  {TABS.map(t => (
                    <button key={t} onClick={() => setTab(t)}
                      className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 ${
                        tab === t ? 'text-orange-400 border-orange-500' : 'text-zinc-500 border-transparent hover:text-zinc-300'}`}>
                      {t === 'Lecture' && <PlayCircle className="w-4 h-4" />}
                      {t === 'Notes' && <FileText className="w-4 h-4" />}
                      {t === 'Overview' && <BookOpen className="w-4 h-4" />}
                      {t}
                    </button>
                  ))}
                </div>

                {tab === 'Lecture' && (
                  <div className="space-y-5 pb-10">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="min-w-0">
                        <p className="text-xs text-zinc-600 mb-1">Lecture {currentIdx + 1} of {totalLec}</p>
                        <h1 className="text-xl font-bold text-zinc-100">{lecture.title}</h1>
                        {lecture.duration_minutes ? <p className="text-sm text-zinc-500 mt-1">{Math.round(lecture.duration_minutes)} minutes</p> : null}
                      </div>
                      <button onClick={() => setDone(lecture.id, !completed.has(lecture.id))}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shrink-0 ${
                          completed.has(lecture.id)
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'}`}>
                        {completed.has(lecture.id)
                          ? <><CheckCircle2 className="w-4 h-4" /> Completed</>
                          : <><Circle className="w-4 h-4" /> Mark complete</>}
                      </button>
                    </div>
                    {lecture.description && (
                      <p className="text-zinc-400 text-sm leading-relaxed whitespace-pre-line">{lecture.description}</p>
                    )}
                    <p className="text-xs text-zinc-700">Shortcuts: <kbd className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded">N</kbd> next · <kbd className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded">P</kbd> previous</p>
                  </div>
                )}

                {tab === 'Notes' && (
                  <div className="space-y-4 pb-10">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-base font-bold text-zinc-100">My Notes</h2>
                        <p className="text-xs text-zinc-600 mt-0.5">For &ldquo;{lecture.title}&rdquo; — synced to your account</p>
                      </div>
                      <span className={`flex items-center gap-1.5 text-xs ${notesState === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
                        {notesState === 'saving' && <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>}
                        {notesState === 'saved' && <><CheckCircle2 className="w-3.5 h-3.5" /> Saved</>}
                        {notesState === 'error' && 'Saved on this device only'}
                      </span>
                    </div>
                    <textarea
                      value={notes[lecture.id] ?? ''}
                      onChange={e => saveNote(lecture.id, e.target.value)}
                      placeholder={'Key takeaways, code snippets, questions to revisit…'}
                      className="w-full h-72 bg-zinc-900 border border-zinc-800 focus:border-orange-500/60 rounded-xl p-4 text-zinc-300 placeholder:text-zinc-700 text-sm leading-relaxed outline-none transition-colors resize-none"
                    />
                    <div className="flex items-start gap-2 text-xs text-zinc-600">
                      <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5 text-orange-500/50" /> Notes save automatically as you type.
                    </div>
                  </div>
                )}

                {tab === 'Overview' && (
                  <div className="space-y-6 pb-10">
                    {course.description && (
                      <div>
                        <h2 className="text-base font-bold text-zinc-100 mb-2">About this course</h2>
                        <p className="text-zinc-400 text-sm leading-relaxed whitespace-pre-line line-clamp-[12]">{course.description}</p>
                      </div>
                    )}
                    <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
                      <h3 className="text-sm font-bold text-zinc-300 mb-3">Course progress</h3>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-sm font-bold text-orange-400">{pct}%</span>
                      </div>
                      <p className="text-xs text-zinc-500">{doneCount} of {totalLec} lectures completed</p>
                      {pct === 100 ? (
                        <Link href={`/certificate/${courseId}`}
                          className="mt-3 flex items-center justify-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-amber-500/20 transition-colors">
                          <Award className="w-4 h-4" /> Get your certificate
                        </Link>
                      ) : (
                        <p className="text-xs text-zinc-600 mt-3">Complete every lecture to unlock your certificate.</p>
                      )}
                    </div>

                    <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
                      <h3 className="text-sm font-bold text-zinc-300 mb-3">{reviewSaved ? 'Your review' : 'Rate this course'}</h3>
                      <div className="flex gap-1 mb-3">
                        {[1, 2, 3, 4, 5].map(s => (
                          <button key={s} onClick={() => { setRating(s); setReviewSaved(false) }} aria-label={`${s} star`}>
                            <Star className={`w-7 h-7 transition-colors ${s <= rating ? 'text-amber-400 fill-amber-400' : 'text-zinc-700 hover:text-zinc-500'}`} />
                          </button>
                        ))}
                      </div>
                      <textarea value={reviewText} onChange={e => { setReviewText(e.target.value); setReviewSaved(false) }} maxLength={1000} rows={3}
                        placeholder="What did you like? What could be better? (optional)"
                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-orange-500/60 rounded-xl p-3 text-zinc-300 placeholder:text-zinc-700 text-sm outline-none resize-none" />
                      <button onClick={submitReview} disabled={reviewSaved}
                        className="mt-3 px-5 py-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors">
                        {reviewSaved ? 'Saved' : 'Submit review'}
                      </button>
                    </div>

                    <Link href="/my-courses" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-orange-400 transition-colors">
                      <LayoutGrid className="w-4 h-4" /> All my courses
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-80 gap-4 px-6 text-center">
              <PlayCircle className="w-20 h-20 text-zinc-800" />
              <p className="text-zinc-500 text-sm">This course has no lectures yet — check back soon.</p>
              <Link href={`/courses/${course.slug}`} className="text-orange-400 text-sm underline underline-offset-2">Back to course page</Link>
            </div>
          )}
        </main>

        {/* ── Sidebar: static on desktop, slide-over drawer on mobile ── */}
        {sidebar && (
          <>
            <div className="lg:hidden fixed inset-0 top-14 bg-black/60 z-40" onClick={() => setSidebar(false)} />
            <aside className="order-2 fixed lg:static right-0 top-14 bottom-0 z-50 w-[88vw] max-w-sm lg:w-80 bg-zinc-900 border-l border-zinc-800 flex flex-col shrink-0 overflow-y-auto">
              {curriculum}
            </aside>
          </>
        )}
      </div>
    </div>
  )
}
