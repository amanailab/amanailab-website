import { NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/admin'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export const runtime = 'nodejs'

export async function GET(req: Request, { params }: { params: Promise<{ noteId: string }> }) {
  const ip = getClientIp(req)
  const rl = checkRateLimit(`note-preview:${ip}`, 30, 60_000)
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

  try {
    const { noteId } = await params

    const supabase = getAdminSupabase()
    const { data: note, error } = await supabase
      .from('notes')
      .select('pdf_path')
      .eq('id', noteId)
      .single()

    if (error || !note) return NextResponse.json({ error: 'Note not found.' }, { status: 404 })

    // 5-minute URL — enough to render preview pages, not useful for sharing
    const { data, error: urlErr } = await supabase.storage
      .from('notes')
      .createSignedUrl(note.pdf_path, 300)

    if (urlErr || !data?.signedUrl) {
      return NextResponse.json({ error: 'Could not generate preview.' }, { status: 500 })
    }

    return NextResponse.json({ url: data.signedUrl })
  } catch (err) {
    console.error('[notes/preview-url]', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
