import { NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/admin'
import { getSessionUser, isEnrolled } from '@/lib/lms'

export const runtime = 'nodejs'

// GET ?courseId= — public list of reviews for a course
export async function GET(req: Request) {
  const courseId = new URL(req.url).searchParams.get('courseId')
  if (!courseId) return NextResponse.json({ error: 'Missing courseId.' }, { status: 400 })
  const { data } = await getAdminSupabase()
    .from('course_reviews').select('rating,review_text,created_at')
    .eq('course_id', courseId).not('review_text', 'is', null)
    .order('created_at', { ascending: false }).limit(20)
  return NextResponse.json({ reviews: data ?? [] })
}

// POST { courseId, rating (1-5), text? } — one review per enrolled student (updates if it exists).
export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  const { courseId, rating, text } = await req.json().catch(() => ({}))
  const r = Number(rating)
  if (!courseId || !Number.isInteger(r) || r < 1 || r > 5) return NextResponse.json({ error: 'Rating must be 1-5.' }, { status: 400 })
  if (!(await isEnrolled(user.id, courseId))) return NextResponse.json({ error: 'Enroll first.' }, { status: 403 })

  const { error } = await getAdminSupabase().from('course_reviews').upsert({
    user_id: user.id, course_id: courseId, rating: r,
    review_text: typeof text === 'string' ? text.trim().slice(0, 1000) || null : null,
  }, { onConflict: 'user_id,course_id' })
  if (error) return NextResponse.json({ error: 'Could not save review.' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
