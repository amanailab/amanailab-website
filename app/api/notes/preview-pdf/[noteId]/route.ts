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

    // Generate a short-lived signed URL — then proxy-fetch it so the browser
    // never hits Supabase directly (avoids CORS). Crucially we forward Range
    // headers so PDF.js can do partial fetches and only download pages 1-2.
    const { data: signed, error: signErr } = await supabase.storage
      .from('notes')
      .createSignedUrl(note.pdf_path, 300)

    if (signErr || !signed?.signedUrl) {
      return new Response('Could not load PDF', { status: 500 })
    }

    // Forward Range header if PDF.js asks for a byte range
    const rangeHeader = req.headers.get('Range')
    const upstreamHeaders: Record<string, string> = {}
    if (rangeHeader) upstreamHeaders['Range'] = rangeHeader

    const upstream = await fetch(signed.signedUrl, { headers: upstreamHeaders })

    const resHeaders = new Headers()
    resHeaders.set('Content-Type', 'application/pdf')
    resHeaders.set('Cache-Control', 'private, max-age=300')
    resHeaders.set('Accept-Ranges', 'bytes')  // tell PDF.js range requests are OK

    const contentRange  = upstream.headers.get('Content-Range')
    const contentLength = upstream.headers.get('Content-Length')
    if (contentRange)  resHeaders.set('Content-Range',  contentRange)
    if (contentLength) resHeaders.set('Content-Length', contentLength)

    return new Response(upstream.body, {
      status:  upstream.status,  // 200 or 206 (partial content)
      headers: resHeaders,
    })
  } catch (err) {
    console.error('[notes/preview-pdf]', err)
    return new Response('Something went wrong', { status: 500 })
  }
}
