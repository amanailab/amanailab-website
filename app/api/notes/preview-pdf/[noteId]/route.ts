import { getAdminSupabase } from '@/lib/admin'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export const runtime = 'nodejs'

export async function GET(req: Request, { params }: { params: Promise<{ noteId: string }> }) {
  const ip = getClientIp(req)
  const rl = checkRateLimit(`note-preview-pdf:${ip}`, 20, 60_000)
  if (!rl.allowed) return new Response('Too many requests', { status: 429 })

  try {
    const { noteId } = await params
    const supabase = getAdminSupabase()

    const { data: note, error } = await supabase
      .from('notes')
      .select('pdf_path')
      .eq('id', noteId)
      .single()

    if (error || !note) return new Response('Not found', { status: 404 })

    // Download server-side — no CORS, no signed URL needed in browser
    const { data, error: dlErr } = await supabase.storage
      .from('notes')
      .download(note.pdf_path)

    if (dlErr || !data) return new Response('Could not load PDF', { status: 500 })

    return new Response(data, {
      headers: {
        'Content-Type': 'application/pdf',
        'Cache-Control': 'private, max-age=300',
      },
    })
  } catch (err) {
    console.error('[notes/preview-pdf]', err)
    return new Response('Something went wrong', { status: 500 })
  }
}
