import { NextResponse } from 'next/server'
import { courseOfLecture, getSessionUser, isEnrolled, resolveVideo } from '@/lib/lms'

export const runtime = 'nodejs'

// GET — playable video for a lecture. Allowed for free-preview lectures of published courses,
// or for students enrolled in the course. Private storage files are returned as short-lived signed URLs.
export async function GET(_req: Request, { params }: { params: Promise<{ lectureId: string }> }) {
  const { lectureId } = await params
  const [lec, user] = await Promise.all([courseOfLecture(lectureId), getSessionUser()])
  if (!lec || !lec.videoUrl) return NextResponse.json({ error: 'No video.' }, { status: 404 })

  if (!(lec.isPreview && lec.published)) {
    if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })
    if (!(await isEnrolled(user.id, lec.courseId))) {
      return NextResponse.json({ error: 'Enroll to watch this lecture.' }, { status: 403 })
    }
  }

  const video = await resolveVideo(lec.videoUrl)
  if (!video) return NextResponse.json({ error: 'Video unavailable.' }, { status: 502 })
  return NextResponse.json({ video }, { headers: { 'Cache-Control': 'private, no-store' } })
}
