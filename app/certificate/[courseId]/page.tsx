'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Award, Download, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Course = { id: string; title: string; level: string; duration_hours: number | null }

export default function CertificatePage() {
  const params   = useParams()
  const router   = useRouter()
  const courseId = params?.courseId as string
  const certRef  = useRef<HTMLDivElement>(null)

  const [course, setCourse]     = useState<Course | null>(null)
  const [userName, setUserName] = useState('')
  const [loading, setLoading]   = useState(true)
  const [eligible, setEligible] = useState(false)

  useEffect(() => {
    if (!courseId) return
    const supabase = createClient()

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const email = user.email ?? ''
      setUserName(email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))

      const { data: courseData } = await supabase
        .from('courses').select('id,title,level,duration_hours').eq('id', courseId).single()
      if (!courseData) { setLoading(false); return }
      setCourse(courseData as Course)

      // Check enrollment
      const { data: enroll } = await supabase
        .from('enrollments').select('id').eq('user_id', user.id).eq('course_id', courseId).maybeSingle()
      if (!enroll) { router.push('/courses'); return }

      // Check 100% completion
      const { data: lectures } = await supabase
        .from('course_lectures').select('id, course_sections!inner(course_id)')
        .eq('course_sections.course_id', courseId)
      const { data: progress } = await supabase
        .from('lecture_progress').select('lecture_id').eq('user_id', user.id)
      const lectureIds = new Set((lectures ?? []).map((l: { id: string }) => l.id))
      const doneIds    = new Set((progress ?? []).map((p: { lecture_id: string }) => p.lecture_id))
      const isComplete = lectureIds.size > 0 && [...lectureIds].every(id => doneIds.has(id))
      setEligible(isComplete)
      setLoading(false)
    }

    load()
  }, [courseId, router])

  async function downloadCert() {
    if (!certRef.current || !course) return
    const { default: html2canvas } = await import('html-to-image')
    const { default: jsPDF } = await import('jspdf')
    const dataUrl = await html2canvas.toPng(certRef.current, { pixelRatio: 2, backgroundColor: '#09090b' })
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [1122, 794] })
    pdf.addImage(dataUrl, 'PNG', 0, 0, 1122, 794)
    pdf.save(`AmanAILab-${course.title.replace(/\s+/g, '-')}-Certificate.pdf`)
  }

  if (loading) return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
    </main>
  )

  if (!course) return (
    <main className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4">
      <p className="text-zinc-300">Course not found.</p>
      <Link href="/courses" className="text-orange-400 hover:text-orange-300 text-sm underline underline-offset-2">Browse courses</Link>
    </main>
  )

  if (!eligible) return (
    <main className="min-h-screen bg-zinc-950 pt-24 flex flex-col items-center justify-center gap-6 px-4">
      <div className="w-20 h-20 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
        <Award className="w-10 h-10 text-zinc-600" />
      </div>
      <div className="text-center">
        <h1 className="text-xl font-bold text-zinc-100 mb-2">Complete the course first</h1>
        <p className="text-zinc-500 text-sm">You need to mark all lectures as complete to earn your certificate.</p>
      </div>
      <Link href={`/learn/${courseId}`}
        className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm">
        Continue Learning
      </Link>
    </main>
  )

  const completionDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <main className="min-h-screen bg-zinc-950 pt-20 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link href={`/learn/${courseId}`} className="flex items-center gap-2 text-zinc-500 hover:text-orange-400 transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to course
          </Link>
          <button onClick={downloadCert}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-bold px-5 py-2.5 rounded-xl transition-colors text-sm">
            <Download className="w-4 h-4" /> Download PDF
          </button>
        </div>

        {/* Certificate */}
        <div ref={certRef} className="relative bg-zinc-950 border-2 border-orange-500/30 rounded-3xl overflow-hidden aspect-[1122/794] flex flex-col items-center justify-center p-16 text-center">
          {/* Decorative corners */}
          <div className="absolute top-0 left-0 w-32 h-32 border-t-4 border-l-4 border-orange-500/40 rounded-tl-3xl" />
          <div className="absolute top-0 right-0 w-32 h-32 border-t-4 border-r-4 border-orange-500/40 rounded-tr-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 border-b-4 border-l-4 border-orange-500/40 rounded-bl-3xl" />
          <div className="absolute bottom-0 right-0 w-32 h-32 border-b-4 border-r-4 border-orange-500/40 rounded-br-3xl" />
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/3 via-transparent to-orange-500/3 pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center gap-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center">
                <Award className="w-7 h-7 text-white" />
              </div>
              <div className="text-left">
                <p className="text-orange-400 font-black text-lg tracking-tight">Aman<span className="text-zinc-100">AI</span> Lab</p>
                <p className="text-zinc-500 text-xs">Certificate of Completion</p>
              </div>
            </div>

            <div>
              <p className="text-zinc-400 text-base mb-3">This is to certify that</p>
              <h2 className="text-4xl sm:text-5xl font-black text-zinc-100 mb-3">{userName}</h2>
              <p className="text-zinc-400 text-base">has successfully completed</p>
            </div>

            <div className="border border-orange-500/30 rounded-2xl px-10 py-5 bg-orange-500/5">
              <h3 className="text-2xl sm:text-3xl font-black text-orange-400">{course.title}</h3>
              <p className="text-zinc-500 text-sm mt-1 capitalize">{course.level} level{course.duration_hours ? ` · ${course.duration_hours}h` : ''}</p>
            </div>

            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
              <p className="text-sm font-semibold">Completed on {completionDate}</p>
            </div>

            <p className="text-zinc-600 text-xs mt-2">Issued by AmanAI Lab · amanailab.com</p>
          </div>
        </div>
      </div>
    </main>
  )
}
