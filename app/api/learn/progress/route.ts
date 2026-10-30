import { NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/admin'
import { courseOfLecture, getSessionUser, isEnrolled } from '@/lib/lms'

export const runtime = 'nodejs'

// POST { lectureId, completed?: boolean, position?: number }
// completed=true/false toggles the tick; position (seconds) saves the resume point.
export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const lectureId = typeof body.lectureId === 'string' ? body.lectureId : ''
  if (!lectureId) return NextResponse.json({ error: 'Missing lectureId.' }, { status: 400 })

  const lec = await courseOfLecture(lectureId)
  if (!lec || !(await isEnrolled(user.id, lec.courseId))) {
    return NextResponse.json({ error: 'Not enrolled.' }, { status: 403 })
  }

  const sb = getAdminSupabase()

  if (typeof body.completed === 'boolean') {
    const op = body.completed
      ? await sb.from('lecture_progress').upsert({ user_id: user.id, lecture_id: lectureId }, { onConflict: 'user_id,lecture_id', ignoreDuplicates: true })
      : await sb.from('lecture_progress').delete().eq('user_id', user.id).eq('lecture_id', lectureId)
    if (op.error) return NextResponse.json({ error: 'Could not save progress.' }, { status: 500 })
  }

  if (typeof body.position === 'number' && Number.isFinite(body.position) && body.position >= 0) {
    const { error } = await sb.from('lecture_positions').upsert({
      user_id: user.id, lecture_id: lectureId, course_id: lec.courseId,
      position_seconds: Math.floor(body.position), updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,lecture_id' })
    if (error) return NextResponse.json({ error: 'Could not save position.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
