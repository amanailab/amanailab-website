'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  Star, Users, Clock, ChevronDown, ChevronUp, PlayCircle, Lock, CheckCircle2,
  GraduationCap, Zap, ArrowLeft, ShoppingCart, BookOpen, Award, Loader2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Course = {
  id: string
  slug: string
  title: string
  short_description: string | null
  description: string | null
  thumbnail_url: string | null
  preview_video_url: string | null
  price: number
  currency: string
  level: string
  duration_hours: number | null
  students_count: number
  rating: number
  rating_count: number
  is_free: boolean
  stripe_price_id: string | null
}

type Section = {
  id: string
  title: string
  position: number
  lectures: Lecture[]
}

type Lecture = {
  id: string
  title: string
  duration_minutes: number | null
  is_preview: boolean
  position: number
}

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex">
        {[1,2,3,4,5].map(s => (
          <Star key={s} className={`w-4 h-4 ${s <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-zinc-600'}`} />
        ))}
      </div>
      <span className="text-zinc-300 font-semibold">{rating > 0 ? rating.toFixed(1) : 'New'}</span>
      {count > 0 && <span className="text-zinc-500 text-sm">({count.toLocaleString()} ratings)</span>}
    </div>
  )
}

function CurriculumSection({ section, isEnrolled }: { section: Section; isEnrolled: boolean }) {
  const [open, setOpen] = useState(false)
  const totalMins = section.lectures.reduce((acc, l) => acc + (l.duration_minutes ?? 0), 0)

  return (
    <div className="border border-zinc-800 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 bg-zinc-900 hover:bg-zinc-800/60 transition-colors text-left">
        <div>
          <p className="font-semibold text-zinc-100 text-sm">{section.title}</p>
          <p className="text-xs text-zinc-500 mt-0.5">{section.lectures.length} lectures · {Math.round(totalMins)} min</p>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-zinc-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" />}
      </button>
      {open && (
        <div className="divide-y divide-zinc-800/60">
          {section.lectures.map(lecture => (
            <div key={lecture.id} className="flex items-center gap-3 px-5 py-3 bg-zinc-950">
              {lecture.is_preview || isEnrolled ? (
                <PlayCircle className="w-4 h-4 text-orange-400 shrink-0" />
              ) : (
                <Lock className="w-4 h-4 text-zinc-600 shrink-0" />
              )}
              <span className={`flex-1 text-sm ${lecture.is_preview || isEnrolled ? 'text-zinc-300' : 'text-zinc-500'}`}>
                {lecture.title}
              </span>
              {lecture.is_preview && !isEnrolled && (
                <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full">Preview</span>
              )}
              {lecture.duration_minutes && (
                <span className="text-xs text-zinc-600 shrink-0">{Math.round(lecture.duration_minutes)} min</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function CourseDetailPage() {
  const params  = useParams()
  const router  = useRouter()
  const slug    = params?.slug as string

  const [course, setCourse]       = useState<Course | null>(null)
  const [sections, setSections]   = useState<Section[]>([])
  const [isEnrolled, setEnrolled] = useState(false)
  const [loading, setLoading]     = useState(true)
  const [buying, setBuying]       = useState(false)
  const [userId, setUserId]       = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    const supabase = createClient()

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id ?? null)

      const { data: courseData } = await supabase
        .from('courses')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single()

      if (!courseData) { setLoading(false); return }
      setCourse(courseData as Course)

      const { data: sectionsData } = await supabase
        .from('course_sections')
        .select('id,title,position,course_lectures(id,title,duration_minutes,is_preview,position)')
        .eq('course_id', courseData.id)
        .order('position')

      const normalized = (sectionsData ?? []).map((s: Record<string, unknown>) => ({
        ...s,
        lectures: ((s.course_lectures as Lecture[]) ?? []).sort((a, b) => a.position - b.position),
      })) as Section[]
      setSections(normalized)

      if (user?.id) {
        const { data: enroll } = await supabase
          .from('enrollments')
          .select('id')
          .eq('user_id', user.id)
          .eq('course_id', courseData.id)
          .maybeSingle()
        setEnrolled(!!enroll)
      }

      setLoading(false)
    }

    load()
  }, [slug])

  async function handleEnroll() {
    if (!course) return
    if (!userId) { router.push('/login?redirect=/courses/' + slug); return }
    if (isEnrolled) { router.push(`/learn/${course.id}`); return }

    if (course.is_free) {
      const supabase = createClient()
      await supabase.from('enrollments').insert({ user_id: userId, course_id: course.id })
      router.push(`/learn/${course.id}`)
      return
    }

    setBuying(true)

    // Load Razorpay script if needed
    if (!document.querySelector('script[src*="razorpay"]')) {
      await new Promise<void>(resolve => {
        const s = document.createElement('script')
        s.src = 'https://checkout.razorpay.com/v1/checkout.js'
        s.onload = () => resolve()
        document.head.appendChild(s)
      })
    }

    const res = await fetch('/api/courses/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId: course.id }),
    })
    const order = await res.json()
    if (!order.id) { setBuying(false); return }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rzp = new (window as any).Razorpay({
      key:         order.key,
      amount:      order.amount,
      currency:    order.currency,
      name:        'AmanAI Lab',
      description: course.title,
      order_id:    order.id,
      prefill:     { email: order.email },
      theme:       { color: '#f97316' },
      handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
        const vRes = await fetch('/api/courses/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...response, courseId: course.id }),
        })
        const vData = await vRes.json()
        if (vData.ok) router.push(`/learn/${course.id}`)
        else { alert('Payment verification failed. Contact support.'); setBuying(false) }
      },
      modal: { ondismiss: () => setBuying(false) },
    })
    rzp.open()
  }

  const totalLectures = sections.reduce((acc, s) => acc + s.lectures.length, 0)
  const totalMins     = sections.reduce((acc, s) => acc + s.lectures.reduce((a, l) => a + (l.duration_minutes ?? 0), 0), 0)
  const levelColor    = { beginner: 'text-emerald-400', intermediate: 'text-blue-400', advanced: 'text-orange-400' }[course?.level ?? ''] ?? 'text-zinc-400'

  if (loading) return (
    <main className="min-h-screen bg-zinc-950 pt-20 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
    </main>
  )

  if (!course) return (
    <main className="min-h-screen bg-zinc-950 pt-20 flex flex-col items-center justify-center gap-4">
      <p className="text-zinc-300 font-semibold text-lg">Course not found</p>
      <Link href="/courses" className="text-orange-400 hover:text-orange-300 text-sm underline underline-offset-2">Browse all courses</Link>
    </main>
  )

  return (
    <main className="min-h-screen bg-zinc-950 pt-16">

      {/* Hero band */}
      <div className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
          <Link href="/courses" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-orange-400 transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> All Courses
          </Link>

          <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
            {/* Left */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs font-bold uppercase tracking-widest ${levelColor}`}>{course.level}</span>
                <span className="text-zinc-700">·</span>
                <span className="text-xs text-zinc-500">AI/ML</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-zinc-100 leading-tight mb-4">{course.title}</h1>
              {course.short_description && <p className="text-zinc-400 text-lg leading-relaxed mb-5">{course.short_description}</p>}

              <div className="flex flex-wrap items-center gap-4 mb-4">
                <StarRating rating={course.rating} count={course.rating_count} />
                <span className="flex items-center gap-1.5 text-sm text-zinc-400"><Users className="w-4 h-4" /> {course.students_count.toLocaleString()} students</span>
                {course.duration_hours && <span className="flex items-center gap-1.5 text-sm text-zinc-400"><Clock className="w-4 h-4" /> {course.duration_hours}h total</span>}
              </div>

              <p className="text-sm text-zinc-500">By <span className="text-orange-400 font-semibold">Aman Chauhan</span> · AI/ML Engineer & Educator</p>
            </div>

            {/* Right — sticky buy card (hidden on mobile, shown below) */}
            <div className="hidden lg:block w-80 shrink-0">
              <BuyCard course={course} isEnrolled={isEnrolled} buying={buying} onAction={handleEnroll} totalLectures={totalLectures} totalMins={totalMins} />
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-10">

          {/* Main */}
          <div className="flex-1 min-w-0 space-y-10">

            {/* Preview video */}
            {course.preview_video_url && (
              <section>
                <h2 className="text-xl font-bold text-zinc-100 mb-4">Course Preview</h2>
                <div className="aspect-video rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800">
                  <iframe
                    src={course.preview_video_url.replace('watch?v=', 'embed/')}
                    title={`${course.title} preview`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </section>
            )}

            {/* Description */}
            {course.description && (
              <section>
                <h2 className="text-xl font-bold text-zinc-100 mb-4">About This Course</h2>
                <div className="prose prose-invert prose-sm max-w-none text-zinc-400 leading-relaxed whitespace-pre-line">{course.description}</div>
              </section>
            )}

            {/* Curriculum */}
            {sections.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-zinc-100">Course Curriculum</h2>
                  <span className="text-sm text-zinc-500">{totalLectures} lectures · {Math.round(totalMins)} min</span>
                </div>
                <div className="space-y-2">
                  {sections.map(section => (
                    <CurriculumSection key={section.id} section={section} isEnrolled={isEnrolled} />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar — hidden on desktop (shown in hero) */}
          <div className="lg:hidden">
            <BuyCard course={course} isEnrolled={isEnrolled} buying={buying} onAction={handleEnroll} totalLectures={totalLectures} totalMins={totalMins} />
          </div>
        </div>
      </div>
    </main>
  )
}

function BuyCard({ course, isEnrolled, buying, onAction, totalLectures, totalMins }: {
  course: Course; isEnrolled: boolean; buying: boolean
  onAction: () => void; totalLectures: number; totalMins: number
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden sticky top-20">
      {course.thumbnail_url && (
        <div className="relative aspect-video">
          <Image src={course.thumbnail_url} alt={course.title} fill className="object-cover" />
        </div>
      )}
      <div className="p-6 space-y-4">
        <div className="flex items-end gap-2">
          <span className={`text-3xl font-black ${course.is_free ? 'text-emerald-400' : 'text-orange-400'}`}>
            {course.is_free ? 'Free' : `₹${course.price.toLocaleString('en-IN')}`}
          </span>
        </div>

        <button onClick={onAction} disabled={buying}
          className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-60 text-white font-bold py-3.5 px-6 rounded-xl transition-colors text-base">
          {buying ? <Loader2 className="w-5 h-5 animate-spin" /> : isEnrolled ? <><BookOpen className="w-5 h-5" /> Continue Learning</> : course.is_free ? <><Zap className="w-5 h-5" /> Enroll Free</> : <><ShoppingCart className="w-5 h-5" /> Buy Now</>}
        </button>

        {!isEnrolled && !course.is_free && (
          <p className="text-xs text-center text-zinc-500">30-day money-back guarantee</p>
        )}

        <div className="space-y-2.5 pt-2 border-t border-zinc-800">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">This course includes</p>
          {[
            { icon: PlayCircle, text: `${totalLectures} video lectures` },
            { icon: Clock,      text: `${Math.round(totalMins)} minutes of content` },
            { icon: GraduationCap, text: 'Certificate of completion' },
            { icon: Award,      text: 'Lifetime access' },
            { icon: CheckCircle2, text: 'Mobile + desktop access' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2.5 text-sm text-zinc-400">
              <Icon className="w-4 h-4 text-orange-500 shrink-0" />
              {text}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
