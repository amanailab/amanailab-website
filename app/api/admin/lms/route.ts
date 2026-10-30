import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getAdminSupabase } from '@/lib/admin'
import { verifyAdminSession } from '@/lib/auth-tokens'
import { extractPlaylistId, fetchPlaylistForImport } from '@/lib/youtube'
import { VIDEO_BUCKET } from '@/lib/lms'

export const runtime = 'nodejs'
export const maxDuration = 60

// One admin endpoint for the whole course CMS. The browser used to write straight to Supabase with the
// student session, which RLS rejects for admins (admin login is a password cookie, not a Supabase user).
// Everything now goes through here with the service key, behind the admin session check.

const COURSE_FIELDS = [
  'slug', 'title', 'short_description', 'description', 'thumbnail_url', 'preview_video_url',
  'price', 'level', 'duration_hours', 'is_published', 'is_free', 'stripe_price_id',
] as const

type Body = Record<string, unknown>
const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
const nul = (v: unknown) => str(v) || null

async function authed() {
  return verifyAdminSession((await cookies()).get('admin_session')?.value)
}

const fail = (error: string, status = 400) => NextResponse.json({ error }, { status })

async function recalcDuration(courseId: string) {
  const sb = getAdminSupabase()
  const { data } = await sb
    .from('course_sections')
    .select('course_lectures(duration_minutes)')
    .eq('course_id', courseId)
  const mins = (data ?? []).flatMap(s => (s.course_lectures ?? []) as { duration_minutes: number | null }[])
    .reduce((a, l) => a + Number(l.duration_minutes ?? 0), 0)
  if (mins > 0) await sb.from('courses').update({ duration_hours: Math.round((mins / 60) * 10) / 10 }).eq('id', courseId)
}

async function courseIdOfSection(sectionId: string): Promise<string | null> {
  const { data } = await getAdminSupabase().from('course_sections').select('course_id').eq('id', sectionId).maybeSingle()
  return (data?.course_id as string) ?? null
}

/** Swap an item with its neighbour and rewrite contiguous positions. */
async function move(table: 'course_sections' | 'course_lectures', id: string, dir: 'up' | 'down') {
  const sb = getAdminSupabase()
  const { data: row } = await sb.from(table).select('*').eq('id', id).maybeSingle()
  if (!row) return false
  const parentCol = table === 'course_sections' ? 'course_id' : 'section_id'
  const { data: siblings } = await sb.from(table).select('id,position').eq(parentCol, row[parentCol]).order('position').order('created_at')
  const list = (siblings ?? []) as { id: string }[]
  const i = list.findIndex(s => s.id === id)
  const j = dir === 'up' ? i - 1 : i + 1
  if (i < 0 || j < 0 || j >= list.length) return true
  ;[list[i], list[j]] = [list[j], list[i]]
  await Promise.all(list.map((s, idx) => sb.from(table).update({ position: idx }).eq('id', s.id)))
  return true
}

export async function POST(req: Request) {
  if (!(await authed())) return fail('Unauthorized', 401)

  const body = (await req.json().catch(() => ({}))) as Body
  const action = str(body.action)
  const sb = getAdminSupabase()

  try {
    switch (action) {
      // ── Courses ──────────────────────────────────────────────────────────────
      case 'courses.list': {
        const { data, error } = await sb.from('courses').select('*').order('created_at', { ascending: false })
        if (error) return fail(error.message, 500)
        return NextResponse.json({ courses: data ?? [] })
      }

      case 'course.save': {
        const c = (body.course ?? {}) as Body
        const payload: Body = {}
        for (const f of COURSE_FIELDS) if (f in c) payload[f] = c[f]
        for (const f of ['short_description', 'description', 'thumbnail_url', 'preview_video_url', 'stripe_price_id'] as const) {
          if (f in payload) payload[f] = nul(payload[f])
        }
        if ('title' in payload) payload.title = str(payload.title)
        if ('slug' in payload) payload.slug = str(payload.slug).toLowerCase().replace(/[^a-z0-9-]/g, '')
        if ('price' in payload) payload.price = Math.max(0, Number(payload.price) || 0)
        if (payload.is_free === true) payload.price = 0

        const id = str(c.id)
        if (!id) {
          if (!payload.title || !payload.slug) return fail('Title and slug are required.')
          const { data, error } = await sb.from('courses').insert({ ...payload, students_count: 0 }).select().single()
          if (error) return fail(error.code === '23505' ? 'That slug is already used.' : error.message, 400)
          return NextResponse.json({ course: data })
        }
        const { data, error } = await sb.from('courses').update(payload).eq('id', id).select().single()
        if (error) return fail(error.code === '23505' ? 'That slug is already used.' : error.message, 400)
        return NextResponse.json({ course: data })
      }

      case 'course.delete': {
        const { error } = await sb.from('courses').delete().eq('id', str(body.id))
        if (error) return fail(error.message, 500)
        return NextResponse.json({ ok: true })
      }

      // ── Curriculum ───────────────────────────────────────────────────────────
      case 'curriculum.get': {
        const { data, error } = await sb
          .from('course_sections')
          .select('id,title,position,course_lectures(id,title,description,video_url,duration_minutes,is_preview,position)')
          .eq('course_id', str(body.courseId)).order('position')
        if (error) return fail(error.message, 500)
        const sections = (data ?? []).map(s => ({
          ...s,
          lectures: ((s.course_lectures ?? []) as { position: number }[]).sort((a, b) => a.position - b.position),
          course_lectures: undefined,
        }))
        return NextResponse.json({ sections })
      }

      case 'section.add': {
        const courseId = str(body.courseId)
        const title = str(body.title)
        if (!courseId || !title) return fail('Section title is required.')
        const { count } = await sb.from('course_sections').select('id', { count: 'exact', head: true }).eq('course_id', courseId)
        const { data, error } = await sb.from('course_sections').insert({ course_id: courseId, title, position: count ?? 0 }).select().single()
        if (error) return fail(error.message, 500)
        return NextResponse.json({ section: data })
      }

      case 'section.rename': {
        const title = str(body.title)
        if (!title) return fail('Title is required.')
        const { error } = await sb.from('course_sections').update({ title }).eq('id', str(body.id))
        if (error) return fail(error.message, 500)
        return NextResponse.json({ ok: true })
      }

      case 'section.delete': {
        const courseId = await courseIdOfSection(str(body.id))
        const { error } = await sb.from('course_sections').delete().eq('id', str(body.id))
        if (error) return fail(error.message, 500)
        if (courseId) await recalcDuration(courseId)
        return NextResponse.json({ ok: true })
      }

      case 'section.move': {
        await move('course_sections', str(body.id), body.dir === 'up' ? 'up' : 'down')
        return NextResponse.json({ ok: true })
      }

      case 'lecture.add':
      case 'lecture.update': {
        const l = (body.lecture ?? {}) as Body
        const fields: Body = {
          title: str(l.title),
          description: nul(l.description),
          video_url: nul(l.video_url),
          duration_minutes: l.duration_minutes === '' || l.duration_minutes == null ? null : Number(l.duration_minutes),
          is_preview: l.is_preview === true,
        }
        if (!fields.title) return fail('Lecture title is required.')
        if (fields.duration_minutes !== null && !Number.isFinite(fields.duration_minutes)) fields.duration_minutes = null

        if (action === 'lecture.add') {
          const sectionId = str(l.section_id)
          const { count } = await sb.from('course_lectures').select('id', { count: 'exact', head: true }).eq('section_id', sectionId)
          const { data, error } = await sb.from('course_lectures').insert({ ...fields, section_id: sectionId, position: count ?? 0 }).select().single()
          if (error) return fail(error.message, 500)
          const cid = await courseIdOfSection(sectionId)
          if (cid) await recalcDuration(cid)
          return NextResponse.json({ lecture: data })
        }

        const { data, error } = await sb.from('course_lectures').update(fields).eq('id', str(l.id)).select('*, course_sections(course_id)').single()
        if (error) return fail(error.message, 500)
        const cid = (data.course_sections as unknown as { course_id: string })?.course_id
        if (cid) await recalcDuration(cid)
        return NextResponse.json({ lecture: data })
      }

      case 'lecture.delete': {
        const { data: row } = await sb.from('course_lectures').select('section_id').eq('id', str(body.id)).maybeSingle()
        const { error } = await sb.from('course_lectures').delete().eq('id', str(body.id))
        if (error) return fail(error.message, 500)
        const cid = row ? await courseIdOfSection(row.section_id as string) : null
        if (cid) await recalcDuration(cid)
        return NextResponse.json({ ok: true })
      }

      case 'lecture.move': {
        await move('course_lectures', str(body.id), body.dir === 'up' ? 'up' : 'down')
        return NextResponse.json({ ok: true })
      }

      // Move a lecture to the end of another section
      case 'lecture.setSection': {
        const toSection = str(body.sectionId)
        const { count } = await sb.from('course_lectures').select('id', { count: 'exact', head: true }).eq('section_id', toSection)
        const { error } = await sb.from('course_lectures').update({ section_id: toSection, position: count ?? 0 }).eq('id', str(body.id))
        if (error) return fail(error.message, 500)
        return NextResponse.json({ ok: true })
      }

      // ── Add (or sync) a YouTube playlist into an EXISTING course ─────────────
      case 'playlist.append': {
        const courseId = str(body.courseId)
        const playlistId = extractPlaylistId(str(body.playlistUrl))
        if (!courseId) return fail('Missing course.')
        if (!playlistId) return fail('That link has no playlist id (it must contain "list=").')

        const pl = await fetchPlaylistForImport(playlistId)
        if (!pl || !pl.videos.length) return fail('Could not read that playlist. Make sure it is public.', 502)

        // Target section: existing id, or create a new one named after the playlist
        let sectionId = str(body.sectionId)
        if (!sectionId) {
          const { count } = await sb.from('course_sections').select('id', { count: 'exact', head: true }).eq('course_id', courseId)
          const { data: sec, error } = await sb.from('course_sections')
            .insert({ course_id: courseId, title: str(body.newSectionTitle) || pl.title, position: count ?? 0 }).select().single()
          if (error || !sec) return fail(error?.message ?? 'Could not create section.', 500)
          sectionId = sec.id as string
        }

        // Skip videos already present anywhere in this course (so re-syncing only adds new ones)
        const { data: existing } = await sb.from('course_sections')
          .select('course_lectures(video_url)').eq('course_id', courseId)
        const have = new Set((existing ?? []).flatMap(s => (s.course_lectures ?? []) as { video_url: string | null }[]).map(l => l.video_url))
        const fresh = pl.videos.filter(v => !have.has(`https://www.youtube.com/watch?v=${v.videoId}`))
        if (!fresh.length) return NextResponse.json({ ok: true, added: 0 })

        const { count: start } = await sb.from('course_lectures').select('id', { count: 'exact', head: true }).eq('section_id', sectionId)
        const rows = fresh.map((v, i) => ({
          section_id: sectionId, title: v.title, description: v.description || null,
          video_url: `https://www.youtube.com/watch?v=${v.videoId}`, duration_minutes: v.durationMinutes,
          is_preview: false, position: (start ?? 0) + i,
        }))
        const { error } = await sb.from('course_lectures').insert(rows)
        if (error) return fail(error.message, 500)
        await recalcDuration(courseId)
        return NextResponse.json({ ok: true, added: rows.length })
      }

      // ── Direct video upload: hand the browser a signed upload URL (admin has no Supabase session) ──
      case 'upload.sign': {
        const ext = (str(body.filename).split('.').pop() || 'mp4').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) || 'mp4'
        const path = `${new Date().getFullYear()}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
        const { data, error } = await sb.storage.from(VIDEO_BUCKET).createSignedUploadUrl(path)
        if (error || !data) return fail(error?.message ?? 'Could not create upload URL. Does the course-videos bucket exist?', 500)
        return NextResponse.json({ path: data.path, token: data.token, bucket: VIDEO_BUCKET, ref: `storage:${VIDEO_BUCKET}/${data.path}` })
      }

      default:
        return fail('Unknown action.')
    }
  } catch (e) {
    console.error('[admin/lms]', action, e)
    return fail('Server error.', 500)
  }
}
