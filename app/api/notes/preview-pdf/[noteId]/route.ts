import { getAdminSupabase } from '@/lib/admin'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { PDFDocument } from 'pdf-lib'

export const runtime = 'nodejs'

const PREVIEW_PAGES = 2

export async function GET(req: Request, { params }: { params: Promise<{ noteId: string }> }) {
  const ip = getClientIp(req)
  const rl = checkRateLimit(`note-preview-pdf:${ip}`, 20, 60_000)
  if (!rl.allowed) return new Response('Too many requests', { status: 429 })

  try {
    const { noteId } = await params
    const supabase   = getAdminSupabase()

    const { data: note, error } = await supabase
      .from('notes')
      .select('pdf_path')
      .eq('id', noteId)
      .single()

    if (error || !note?.pdf_path) return new Response('Not found', { status: 404 })

    // Download the full PDF server-side (never exposed to the browser)
    const { data, error: dlErr } = await supabase.storage
      .from('notes')
      .download(note.pdf_path)

    if (dlErr || !data) {
      console.error('[notes/preview-pdf] download error:', dlErr?.message)
      return new Response('Could not load PDF', { status: 500 })
    }

    // Build a trimmed PDF containing only the first PREVIEW_PAGES pages so the
    // paid content never leaves the server. Even a direct hit on this URL, or
    // the browser network tab, only ever yields the preview pages.
    let previewBytes: Uint8Array
    let totalPages = 0
    try {
      const full = await PDFDocument.load(await data.arrayBuffer(), { ignoreEncryption: true })
      totalPages = full.getPageCount()
      const out  = await PDFDocument.create()
      const take = Math.min(PREVIEW_PAGES, totalPages)
      const copied = await out.copyPages(full, Array.from({ length: take }, (_, i) => i))
      copied.forEach(p => out.addPage(p))
      previewBytes = await out.save()
    } catch (e) {
      console.error('[notes/preview-pdf] trim failed:', e)
      return new Response('Could not build preview', { status: 500 })
    }

    return new Response(Buffer.from(previewBytes), {
      headers: {
        'Content-Type':   'application/pdf',
        'Cache-Control':  'private, max-age=300',
        'Accept-Ranges':  'none',
        'X-Total-Pages':  String(totalPages),
      },
    })
  } catch (err) {
    console.error('[notes/preview-pdf]', err)
    return new Response('Something went wrong', { status: 500 })
  }
}
