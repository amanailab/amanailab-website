import { NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/admin'
import { getSessionUser } from '@/lib/lms'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export const runtime = 'nodejs'

// POST { courseId } — enrol in a FREE, published course. Paid courses must go through Razorpay.
export async function POST(req: Request) {
  const rl = checkRateLimit(`course-free:${getClientIp(req)}`, 20, 60_000)
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  const { courseId } = await req.json().catch(() => ({}))
  if (!courseId) return NextResponse.json({ error: 'Missing courseId.' }, { status: 400 })

  const sb = getAdminSupabase()
  const { data: course } = await sb.from('courses').select('id,is_free,is_published,price').eq('id', courseId).maybeSingle()
  if (!course || !course.is_published) return NextResponse.json({ error: 'Course not available.' }, { status: 404 })
  if (!course.is_free) return NextResponse.json({ error: 'This course is paid.' }, { status: 402 })

  const { error } = await sb.from('enrollments').insert({ user_id: user.id, course_id: courseId })
  if (error && error.code !== '23505') return NextResponse.json({ error: 'Could not enroll.' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
