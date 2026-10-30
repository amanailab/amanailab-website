import { NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/admin'
import { getSessionUser, isEnrolled } from '@/lib/lms'

export const runtime = 'nodejs'

// GET — everything the classroom needs: curriculum (without video URLs), progress, notes, resume point.
export async function GET(_req: Request, { params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })
  if (!(await isEnrolled(user.id, courseId))) return NextResponse.json({ error: 'Not enrolled.' }, { status: 403 })

  const sb = getAdminSupabase()
  const [{ data: course }, { data: secs }, { data: prog }, { data: pos }, { data: review }] = await Promise.all([
    sb.from('courses').select('id,title,slug,thumbnail_url,description').eq('id', courseId).single(),
    sb.from('course_sections')
      .select('id,title,position,course_lectures(id,title,description,duration_minutes,is_preview,position,video_url)')
      .eq('course_id', courseId).order('position'),
    sb.from('lecture_progress').select('lecture_id').eq('user_id', user.id),
    sb.from('lecture_positions').select('lecture_id,position_seconds,updated_at')
      .eq('user_id', user.id).eq('course_id', courseId).order('updated_at', { ascending: false }),
    sb.from('course_reviews').select('rating,review_text').eq('user_id', user.id).eq('course_id', courseId).maybeSingle(),
  ])
  if (!course) return NextResponse.json({ error: 'Course not found.' }, { status: 404 })

  const sections = (secs ?? []).map(s => ({
    id: s.id as string, title: s.title as string, position: s.position as number,
    lectures: ((s.course_lectures ?? []) as Record<string, unknown>[])
      .map(l => ({
        id: l.id as string, title: l.title as string, description: (l.description as string | null) ?? null,
        duration_minutes: (l.duration_minutes as number | null) ?? null,
        is_preview: l.is_preview as boolean, position: l.position as number,
        has_video: !!l.video_url,
      }))
      .sort((a, b) => a.position - b.position),
  }))

  const lectureIds = new Set(sections.flatMap(s => s.lectures.map(l => l.id)))
  const completed = (prog ?? []).map(p => p.lecture_id as string).filter(id => lectureIds.has(id))

  let notes: Record<string, string> = {}
  if (lectureIds.size) {
    const { data: n } = await sb.from('course_notes').select('lecture_id,content')
      .eq('user_id', user.id).in('lecture_id', [...lectureIds])
    notes = Object.fromEntries((n ?? []).map(r => [r.lecture_id as string, r.content as string]))
  }

  return NextResponse.json({
    course, sections, completed, notes, review,
    positions: Object.fromEntries((pos ?? []).map(p => [p.lecture_id as string, p.position_seconds as number])),
    lastLectureId: pos?.[0]?.lecture_id ?? null,
    email: user.email ?? null,
  }, { headers: { 'Cache-Control': 'private, no-store' } })
}
