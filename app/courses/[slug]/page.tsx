'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  Star, Users, Clock, ChevronDown, ChevronUp, PlayCircle, Lock,
  CheckCircle2, GraduationCap, Zap, ArrowLeft, ShoppingCart,
  BookOpen, Award, Loader2, ChevronRight, Shield, Infinity,
  BarChart2, FileText, X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import VideoPlayer from '@/components/courses/VideoPlayer'

type Course = {
  id: string; slug: string; title: string; short_description: string | null
  description: string | null; thumbnail_url: string | null; preview_video_url: string | null
  price: number; currency: string; level: string; duration_hours: number | null
  students_count: number; rating: number; rating_count: number
  is_free: boolean; stripe_price_id: string | null
}
type Review   = { rating: number; review_text: string | null; created_at: string }
type Section  = { id: string; title: string; position: number; lectures: Lecture[] }
type Lecture  = { id: string; title: string; duration_minutes: number | null; is_preview: boolean; position: number }

function Stars({ r, size = 'sm' }: { r: number; size?: 'sm' | 'md' }) {
  const sz = size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5'
  return (
    <span className="flex">
      {[1,2,3,4,5].map(s => (
        <Star key={s} className={`${sz} ${s <= Math.round(r) ? 'text-amber-400 fill-amber-400' : 'text-zinc-600'}`} />
      ))}
    </span>
  )
}

function SectionRow({ section, enrolled, onPreview }: { section: Section; enrolled: boolean; onPreview: (l: Lecture) => void }) {
  const [open, setOpen] = useState(false)
  const mins = section.lectures.reduce((a, l) => a + (l.duration_minutes ?? 0), 0)
  return (
    <div className="border border-zinc-800 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-4 bg-zinc-900 hover:bg-zinc-800/70 transition-colors text-left gap-4">
        <div className="flex items-center gap-3">
          {open ? <ChevronUp className="w-4 h-4 text-zinc-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" />}
          <span className="font-semibold text-zinc-200 text-sm">{section.title}</span>
        </div>
        <span className="text-xs text-zinc-500 shrink-0">{section.lectures.length} lectures · {Math.round(mins)}m</span>
      </button>
      {open && (
        <div className="divide-y divide-zinc-800/50 bg-zinc-950">
          {section.lectures.map(l => (
            <div key={l.id}
              onClick={l.is_preview && !enrolled ? () => onPreview(l) : undefined}
              className={`flex items-center gap-3 px-5 py-3 ${l.is_preview && !enrolled ? 'cursor-pointer hover:bg-zinc-900' : ''}`}>
              {l.is_preview || enrolled
                ? <PlayCircle className="w-4 h-4 text-orange-400 shrink-0" />
                : <Lock className="w-4 h-4 text-zinc-600 shrink-0" />}
              <span className={`flex-1 text-sm ${l.is_preview || enrolled ? 'text-zinc-300' : 'text-zinc-500'}`}>{l.title}</span>
              {l.is_preview && !enrolled && (
                <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full">Preview</span>
              )}
              {l.duration_minutes && <span className="text-xs text-zinc-600 shrink-0">{Math.round(l.duration_minutes)}m</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function CourseDetailPage() {
  const { slug }  = useParams() as { slug: string }
  const router    = useRouter()

  const [course, setCourse]     = useState<Course | null>(null)
  const [sections, setSections] = useState<Section[]>([])
  const [enrolled, setEnrolled] = useState(false)
  const [userId, setUserId]     = useState<string | null>(null)
  const [loading, setLoading]   = useState(true)
  const [buying, setBuying]     = useState(false)
  const [previewLec, setPreviewLec] = useState<Lecture | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [notice, setNotice]   = useState<string | null>(null)
  const [progress, setProgress] = useState<{ pct: number; resume: string | null } | null>(null)

  useEffect(() => {
    if (!slug) return
    const sb = createClient()
    async function load() {
      const { data: { user } } = await sb.auth.getUser()
      setUserId(user?.id ?? null)

      const { data: c } = await sb.from('courses').select('*').eq('slug', slug).eq('is_published', true).single()
      if (!c) { setLoading(false); return }
      setCourse(c as Course)

      const { data: secs } = await sb
        .from('course_sections')
        .select('id,title,position,course_lectures(id,title,duration_minutes,is_preview,position)')
        .eq('course_id', c.id).order('position')
      setSections(
        (secs ?? []).map((s: Record<string, unknown>) => ({
          ...s,
          lectures: ((s.course_lectures as Lecture[]) ?? []).sort((a, b) => a.position - b.position),
        })) as Section[]
      )

      if (user?.id) {
        const { data: e } = await sb.from('enrollments').select('id').eq('user_id', user.id).eq('course_id', c.id).maybeSingle()
        setEnrolled(!!e)
        if (e) {
          fetch('/api/my-courses').then(r => r.ok ? r.json() : null).then(j => {
            const mine = j?.courses?.find((x: { id: string }) => x.id === c.id)
            if (mine) setProgress({ pct: mine.percent, resume: mine.continueLectureId })
          }).catch(() => {})
        }
      }
      fetch(`/api/courses/review?courseId=${c.id}`).then(r => r.ok ? r.json() : null).then(j => setReviews(j?.reviews ?? [])).catch(() => {})
      setLoading(false)
    }
    load()
  }, [slug])

  const fail = (msg: string) => { setNotice(msg); setBuying(false) }

  async function handleBuy() {
    if (!course || buying) return
    // 1. Login required
    if (!userId) { router.push('/login?redirect=/courses/' + slug); return }
    // 2. Already enrolled → go to classroom
    if (enrolled) { router.push(classroomHref); return }
    setNotice(null); setBuying(true)
    try {
      // 3. Free course → enroll through the server
      if (course.is_free) {
        const r = await fetch('/api/courses/enroll-free', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ courseId: course.id }) })
        if (!r.ok) return fail((await r.json().catch(() => ({}))).error ?? 'Could not enroll. Please try again.')
        router.push('/learn/' + course.id); return
      }
      // 4. Paid → Razorpay
      if (!(window as unknown as { Razorpay?: unknown }).Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const el = document.createElement('script'); el.src = 'https://checkout.razorpay.com/v1/checkout.js'
          el.onload = () => resolve(); el.onerror = () => reject(new Error('script')); document.head.appendChild(el)
        })
      }
      const res   = await fetch('/api/courses/create-order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ courseId: course.id }) })
      const order = await res.json().catch(() => ({}))
      if (!res.ok || !order.id) {
        if (order.error === 'Already enrolled.') { setEnrolled(true); router.push('/learn/' + course.id); return }
        return fail(order.error ?? 'Could not start the payment. Please try again.')
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      new (window as any).Razorpay({
        key: order.key, amount: order.amount, currency: order.currency,
        name: 'AmanAI Lab', description: course.title,
        order_id: order.id, prefill: { email: order.email },
        theme: { color: '#f97316' },
        handler: async (r: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          const v = await fetch('/api/courses/verify-payment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...r, courseId: course.id }) })
          const d = await v.json().catch(() => ({}))
          if (d.ok) router.push('/learn/' + course.id)
          else fail('Your payment went through but we could not unlock the course yet. Do not pay again: refresh in a minute, or contact support with payment id ' + r.razorpay_payment_id + '.')
        },
        modal: { ondismiss: () => setBuying(false) },
      }).open()
    } catch {
      fail('Something went wrong. Check your connection and try again.')
    }
  }

  const totalLectures = sections.reduce((a, s) => a + s.lectures.length, 0)
  const totalMins     = sections.reduce((a, s) => a + s.lectures.reduce((b, l) => b + (l.duration_minutes ?? 0), 0), 0)

  if (loading) return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
    </main>
  )
  if (!course) return (
    <main className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4 pt-20">
      <GraduationCap className="w-16 h-16 text-zinc-700" />
      <p className="text-zinc-400 font-semibold">Course not found</p>
      <Link href="/courses" className="text-orange-400 hover:text-orange-300 text-sm underline underline-offset-2">Browse courses</Link>
    </main>
  )

  const classroomHref = `/learn/${course.id}${progress?.resume ? `?lecture=${progress.resume}` : ''}`
  const levelCfg = { beginner: 'text-emerald-400', intermediate: 'text-blue-400', advanced: 'text-orange-400' }[course.level] ?? 'text-zinc-400'

  const BuyButton = () => (
    <button onClick={handleBuy} disabled={buying}
      className={`w-full flex items-center justify-center gap-2.5 font-bold py-4 px-6 rounded-xl transition-all text-base ${
        enrolled
          ? 'bg-emerald-500 hover:bg-emerald-400 text-white'
          : 'bg-orange-500 hover:bg-orange-400 disabled:opacity-60 text-white shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50'
      }`}>
      {buying
        ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing…</>
        : enrolled
          ? <><PlayCircle className="w-5 h-5" /> {progress && progress.pct > 0 ? `Continue learning · ${progress.pct}%` : 'Start learning'}</>
          : course.is_free
            ? <><Zap className="w-5 h-5" /> Enroll Free</>
            : <><ShoppingCart className="w-5 h-5" /> Enroll Now — {`₹${course.price.toLocaleString('en-IN')}`}</>}
    </button>
  )

  return (
    <main className="min-h-screen bg-zinc-950 pt-16">

      {/* ── Hero band ── */}
      <div className="bg-zinc-900 border-b border-zinc-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(to right,#27272a 1px,transparent 1px),linear-gradient(to bottom,#27272a 1px,transparent 1px)', backgroundSize: '48px 48px' }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14 flex flex-col lg:flex-row gap-10">

          {/* Left */}
          <div className="flex-1 min-w-0">
            <Link href="/courses" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-orange-400 transition-colors mb-4">
              <ArrowLeft className="w-4 h-4" /> All Courses
            </Link>

            <div className="flex items-center gap-2 mb-3">
              <span className={`text-xs font-bold uppercase tracking-widest ${levelCfg}`}>{course.level}</span>
              <span className="text-zinc-700">·</span>
              <span className="text-xs text-zinc-500">AI / Machine Learning</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-zinc-100 leading-tight mb-4">
              {course.title}
            </h1>
            {course.short_description && (
              <p className="text-zinc-400 text-lg leading-relaxed mb-5 max-w-2xl">{course.short_description}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 mb-4">
              {course.rating > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 font-bold">{course.rating.toFixed(1)}</span>
                  <Stars r={course.rating} size="md" />
                  <span className="text-zinc-500 text-sm">({course.rating_count.toLocaleString()} ratings)</span>
                </div>
              )}
              <span className="flex items-center gap-1.5 text-sm text-zinc-400"><Users className="w-4 h-4" />{course.students_count.toLocaleString()} students</span>
              {course.duration_hours && <span className="flex items-center gap-1.5 text-sm text-zinc-400"><Clock className="w-4 h-4" />{course.duration_hours}h total</span>}
            </div>

            <p className="text-sm text-zinc-500">
              Created by <span className="text-orange-400 font-semibold">Aman Chauhan</span> · AI/ML Engineer
            </p>

            {/* Mobile buy button */}
            <div className="lg:hidden mt-6">
              <BuyButton />
              {!enrolled && !course.is_free && <p className="text-xs text-center text-zinc-600 mt-2">30-day money-back guarantee</p>}
            </div>
          </div>

          {/* Desktop sidebar */}
          <div className="hidden lg:block w-80 shrink-0">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden sticky top-20">
              {/* Preview player or thumbnail */}
              <div className="relative aspect-video bg-zinc-900 overflow-hidden">
                {course.preview_video_url
                  ? <VideoPlayer url={course.preview_video_url} title={course.title} thumbnail={course.thumbnail_url} />
                  : course.thumbnail_url
                    ? <Image src={course.thumbnail_url} alt={course.title} fill sizes="320px" unoptimized className="object-cover" />
                    : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-500/10 to-zinc-950">
                        <GraduationCap className="w-16 h-16 text-orange-500/25" />
                      </div>
                    )}
              </div>

              <div className="p-5 space-y-4">
                {!enrolled && (
                  <div>
                    <div className="text-3xl font-black text-orange-400 mb-1">
                      {course.is_free ? 'Free' : `₹${course.price.toLocaleString('en-IN')}`}
                    </div>
                  </div>
                )}
                <BuyButton />
                {!enrolled && !course.is_free && (
                  <p className="text-xs text-center text-zinc-600 flex items-center justify-center gap-1">
                    <Shield className="w-3.5 h-3.5" /> 30-day money-back guarantee
                  </p>
                )}

                <div className="pt-3 border-t border-zinc-800 space-y-2.5">
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">This course includes</p>
                  {[
                    { icon: PlayCircle,  text: `${totalLectures} video lectures` },
                    { icon: Clock,       text: `${Math.round(totalMins / 60 * 10) / 10}h of content` },
                    { icon: Infinity,    text: 'Full lifetime access' },
                    { icon: Award,       text: 'Certificate of completion' },
                    { icon: BarChart2,   text: course.level.charAt(0).toUpperCase() + course.level.slice(1) + ' level' },
                    { icon: FileText,    text: 'Notes included' },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-2.5 text-sm text-zinc-400">
                      <Icon className="w-4 h-4 text-orange-500 shrink-0" /> {text}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-3xl space-y-10">

          {/* Description */}
          {course.description && (
            <section>
              <h2 className="text-xl font-bold text-zinc-100 mb-4">About This Course</h2>
              <div className="text-zinc-400 leading-relaxed whitespace-pre-line text-sm">{course.description}</div>
            </section>
          )}

          {/* Curriculum */}
          {sections.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-zinc-100">Course Curriculum</h2>
                <span className="text-sm text-zinc-500">{totalLectures} lectures · {Math.round(totalMins)}m total</span>
              </div>
              <div className="space-y-2">
                {sections.map(s => <SectionRow key={s.id} section={s} enrolled={enrolled} onPreview={setPreviewLec} />)}
              </div>
              {!enrolled && (
                <div className="mt-5 p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl text-center">
                  <p className="text-zinc-500 text-sm mb-3">
                    {!userId ? 'Login to enroll and access all lectures.' : 'Enroll to unlock all lectures.'}
                  </p>
                  {!userId
                    ? <Link href={`/login?redirect=/courses/${slug}`} className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors">Login to Enroll <ChevronRight className="w-4 h-4" /></Link>
                    : <button onClick={handleBuy} className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors">
                        {course.is_free ? 'Enroll Free' : `Buy Now — ₹${course.price.toLocaleString('en-IN')}`} <ChevronRight className="w-4 h-4" />
                      </button>}
                </div>
              )}
            </section>
          )}

          {/* Reviews */}
          {reviews.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-zinc-100 mb-4">What students say</h2>
              <div className="space-y-3">
                {reviews.map((r, i) => (
                  <div key={i} className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
                    <Stars r={r.rating} />
                    <p className="text-sm text-zinc-300 mt-2 whitespace-pre-line">{r.review_text}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {notice && (
        <div role="alert" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-md w-[calc(100%-2rem)] flex items-start gap-3 bg-zinc-900 border border-red-500/40 text-zinc-200 text-sm px-4 py-3 rounded-xl shadow-2xl">
          <span className="flex-1">{notice}</span>
          <button onClick={() => setNotice(null)} aria-label="Dismiss"><X className="w-4 h-4 text-zinc-500" /></button>
        </div>
      )}

      {previewLec && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4" onClick={() => setPreviewLec(null)}>
          <div className="w-full max-w-3xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3 gap-4">
              <p className="text-zinc-200 font-semibold truncate">{previewLec.title} <span className="text-orange-400 text-xs font-bold ml-2">FREE PREVIEW</span></p>
              <button onClick={() => setPreviewLec(null)} aria-label="Close preview" className="text-zinc-400 hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            <div className="aspect-video rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800">
              <VideoPlayer lectureId={previewLec.id} title={previewLec.title} thumbnail={course.thumbnail_url} autoplay />
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
