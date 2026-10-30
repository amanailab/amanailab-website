import { NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/admin'
import { getSessionUser } from '@/lib/lms'

export const runtime = 'nodejs'

// GET — the student's enrolled courses with progress and a "continue" lecture.
export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  const sb = getAdminSupabase()
  const { data: enr } = await sb.from('enrollments').select('course_id,enrolled_at').eq('user_id', user.id).order('enrolled_at', { ascending: false })
  const ids = (enr ?? []).map(e => e.course_id as string)
  if (!ids.length) return NextResponse.json({ courses: [] })

  const [{ data: courses }, { data: secs }, { data: prog }, { data: pos }] = await Promise.all([
    sb.from('courses').select('id,slug,title,thumbnail_url,level,duration_hours').in('id', ids),
    sb.from('course_sections').select('course_id,position,course_lectures(id,position)').in('course_id', ids),
    sb.from('lecture_progress').select('lecture_id').eq('user_id', user.id),
    sb.from('lecture_positions').select('course_id,lecture_id,updated_at').eq('user_id', user.id).in('course_id', ids).order('updated_at', { ascending: false }),
  ])

  const done = new Set((prog ?? []).map(p => p.lecture_id as string))
  const lastByCourse = new Map<string, string>()
  for (const p of pos ?? []) if (!lastByCourse.has(p.course_id as string)) lastByCourse.set(p.course_id as string, p.lecture_id as string)

  const out = (enr ?? []).map(e => {
    const c = (courses ?? []).find(x => x.id === e.course_id)
    if (!c) return null
    const lectureIds = (secs ?? [])
      .filter(s => s.course_id === c.id)
      .sort((a, b) => (a.position as number) - (b.position as number))
      .flatMap(s => ((s.course_lectures ?? []) as { id: string; position: number }[]).sort((a, b) => a.position - b.position).map(l => l.id))
    const completed = lectureIds.filter(id => done.has(id)).length
    return {
      ...c, total: lectureIds.length, completed,
      percent: lectureIds.length ? Math.round((completed / lectureIds.length) * 100) : 0,
      continueLectureId: lastByCourse.get(c.id as string) ?? lectureIds.find(id => !done.has(id)) ?? lectureIds[0] ?? null,
    }
  }).filter(Boolean)

  return NextResponse.json({ courses: out }, { headers: { 'Cache-Control': 'private, no-store' } })
}
