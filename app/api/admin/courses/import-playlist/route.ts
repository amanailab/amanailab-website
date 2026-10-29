import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getAdminSupabase } from '@/lib/admin'
import { verifyAdminSession } from '@/lib/auth-tokens'
import { extractPlaylistId, fetchPlaylistForImport } from '@/lib/youtube'

export const runtime = 'nodejs'
export const maxDuration = 60

async function auth() {
  const store = await cookies()
  return verifyAdminSession(store.get('admin_session')?.value)
}

function slugify(t: string): string {
  return t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)
}

// POST — paste a YouTube playlist link → create a full course with every video as a lecture
export async function POST(req: Request) {
  if (!(await auth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()

    const playlistId = extractPlaylistId(body.playlistUrl ?? '')
    if (!playlistId) {
      return NextResponse.json(
        { error: 'Could not find a playlist id in that link. Paste a full YouTube playlist URL — it must contain "list=".' },
        { status: 400 }
      )
    }

    const pl = await fetchPlaylistForImport(playlistId)
    if (!pl) {
      return NextResponse.json(
        { error: 'Could not fetch that playlist from YouTube. Make sure it is public and the API key is valid.' },
        { status: 502 }
      )
    }
    if (!pl.videos.length) {
      return NextResponse.json({ error: 'That playlist has no public videos to import.' }, { status: 400 })
    }

    const sb = getAdminSupabase()

    // Build a unique slug
    let slug = slugify(body.title?.trim() || pl.title) || `course-${Date.now()}`
    const { data: clash } = await sb.from('courses').select('id').eq('slug', slug).maybeSingle()
    if (clash) slug = `${slug}-${Date.now().toString(36).slice(-4)}`

    const totalMins = pl.videos.reduce((a, v) => a + (v.durationMinutes ?? 0), 0)
    const price = Number(body.price)
    const isFree = body.is_free === true || price === 0
    const level = ['beginner', 'intermediate', 'advanced'].includes(body.level) ? body.level : 'beginner'

    // 1. Course
    const { data: course, error: cErr } = await sb
      .from('courses')
      .insert({
        slug,
        title: body.title?.trim() || pl.title,
        short_description: (body.short_description?.trim() || pl.description || '').slice(0, 180) || null,
        description: pl.description || null,
        thumbnail_url: pl.thumbnail || null,
        preview_video_url: `https://www.youtube.com/watch?v=${pl.videos[0].videoId}`,
        price: isFree ? 0 : (Number.isFinite(price) ? price : 999),
        currency: 'INR',
        level,
        duration_hours: totalMins > 0 ? Math.round((totalMins / 60) * 10) / 10 : null,
        is_free: isFree,
        is_published: body.is_published === true,
        students_count: 0,
      })
      .select()
      .single()
    if (cErr || !course) {
      return NextResponse.json({ error: cErr?.message ?? 'Failed to create course.' }, { status: 500 })
    }

    // 2. One section holding the playlist
    const { data: section, error: sErr } = await sb
      .from('course_sections')
      .insert({ course_id: course.id, title: 'Course Content', position: 0 })
      .select()
      .single()
    if (sErr || !section) {
      await sb.from('courses').delete().eq('id', course.id)
      return NextResponse.json({ error: sErr?.message ?? 'Failed to create section.' }, { status: 500 })
    }

    // 3. One lecture per video (first lecture = free preview)
    const lectures = pl.videos.map((v, i) => ({
      section_id: section.id,
      title: v.title,
      description: v.description || null,
      video_url: `https://www.youtube.com/watch?v=${v.videoId}`,
      duration_minutes: v.durationMinutes,
      is_preview: i === 0,
      position: i,
    }))
    const { error: lErr } = await sb.from('course_lectures').insert(lectures)
    if (lErr) {
      await sb.from('courses').delete().eq('id', course.id)
      return NextResponse.json({ error: lErr.message }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      course,
      slug,
      lectureCount: lectures.length,
    })
  } catch (e) {
    console.error('[admin/courses/import-playlist]', e)
    return NextResponse.json({ error: 'Something went wrong importing the playlist.' }, { status: 500 })
  }
}
