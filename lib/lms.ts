import { createClient } from '@/lib/supabase/server'
import { getAdminSupabase } from '@/lib/admin'

export const VIDEO_BUCKET = 'course-videos'

export type PlayableVideo =
  | { kind: 'youtube'; id: string }
  | { kind: 'file';    url: string }
  | { kind: 'embed';   url: string }

export function youTubeId(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname.endsWith('youtube.com') || u.hostname.endsWith('youtube-nocookie.com')) {
      if (u.pathname.startsWith('/embed/')) return u.pathname.split('/embed/')[1].split(/[?/]/)[0]
      return u.searchParams.get('v')
    }
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).split(/[?/]/)[0] || null
  } catch { /* not a URL */ }
  return null
}

/** Storage path inside the course-videos bucket, for `storage:` refs or legacy public URLs. */
function storagePath(url: string): string | null {
  if (url.startsWith(`storage:${VIDEO_BUCKET}/`)) return url.slice(`storage:${VIDEO_BUCKET}/`.length)
  const m = url.match(new RegExp(`/storage/v1/object/(?:public|sign)/${VIDEO_BUCKET}/([^?]+)`))
  return m ? decodeURIComponent(m[1]) : null
}

/** Turn whatever the admin pasted into something the player can render. Signs private storage files. */
export async function resolveVideo(url: string): Promise<PlayableVideo | null> {
  if (!url) return null

  const yt = youTubeId(url)
  if (yt) return { kind: 'youtube', id: yt }

  const path = storagePath(url)
  if (path) {
    const { data, error } = await getAdminSupabase().storage.from(VIDEO_BUCKET).createSignedUrl(path, 60 * 60 * 4)
    if (error || !data?.signedUrl) return null
    return { kind: 'file', url: data.signedUrl }
  }

  try {
    const u = new URL(url)
    if (u.hostname.endsWith('vimeo.com') && !u.hostname.startsWith('player.')) {
      const id = u.pathname.split('/').filter(Boolean).find(p => /^\d+$/.test(p))
      if (id) return { kind: 'embed', url: `https://player.vimeo.com/video/${id}` }
    }
    if (u.hostname.endsWith('loom.com') && u.pathname.startsWith('/share/')) {
      return { kind: 'embed', url: `https://www.loom.com/embed/${u.pathname.split('/share/')[1]}` }
    }
    if (/\.(mp4|webm|ogg|mov|m4v)$/i.test(u.pathname)) return { kind: 'file', url }
    return { kind: 'embed', url }
  } catch {
    return null
  }
}

export async function getSessionUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function isEnrolled(userId: string, courseId: string): Promise<boolean> {
  const { data } = await getAdminSupabase()
    .from('enrollments').select('id').eq('user_id', userId).eq('course_id', courseId).maybeSingle()
  return !!data
}

/** Course id a lecture belongs to + whether that course is published. */
export async function courseOfLecture(lectureId: string) {
  const { data } = await getAdminSupabase()
    .from('course_lectures')
    .select('id, is_preview, video_url, course_sections!inner(course_id, courses!inner(is_published))')
    .eq('id', lectureId)
    .maybeSingle()
  if (!data) return null
  const sec = data.course_sections as unknown as { course_id: string; courses: { is_published: boolean } }
  return {
    lectureId: data.id as string,
    isPreview: data.is_preview as boolean,
    videoUrl: data.video_url as string | null,
    courseId: sec.course_id,
    published: sec.courses.is_published,
  }
}
