import { NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/admin'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const rl = checkRateLimit(`pkg-code:${ip}`, 5, 60_000)
  if (!rl.allowed) return NextResponse.json({ error: 'Too many attempts. Please wait a minute.' }, { status: 429 })

  try {
    const { code, packageId } = await req.json()
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Please enter a code.' }, { status: 400 })
    }

    const validCode = process.env.MEMBER_CODE?.trim()
    if (!validCode) {
      return NextResponse.json({ error: 'Member access is not configured yet.' }, { status: 500 })
    }

    if (code.trim().toUpperCase() !== validCode.toUpperCase()) {
      return NextResponse.json(
        { error: 'Incorrect code. Find the current code in our Members-only Community post on YouTube.' },
        { status: 400 },
      )
    }

    const supabase = getAdminSupabase()
    const { data: pkg, error: pkgErr } = await supabase
      .from('packages')
      .select('note_ids')
      .eq('id', packageId)
      .single()

    if (pkgErr || !pkg?.note_ids?.length) {
      return NextResponse.json({ error: 'Package not found.' }, { status: 404 })
    }

    const { data: notes } = await supabase
      .from('notes')
      .select('id, title, pdf_path')
      .in('id', pkg.note_ids)

    if (!notes?.length) {
      return NextResponse.json({ error: 'Package has no notes.' }, { status: 404 })
    }

    const items: { title: string; url: string }[] = []
    for (const note of notes) {
      const { data } = await supabase.storage.from('notes').createSignedUrl(note.pdf_path, 3600)
      if (data?.signedUrl) items.push({ title: note.title, url: data.signedUrl })
    }

    return NextResponse.json({ items })
  } catch (err) {
    console.error('[pkg/verify-code]', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
