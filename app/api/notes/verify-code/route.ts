import { NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/admin'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { sendReceiptEmail } from '@/lib/send-receipt'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const rl = checkRateLimit(`notes-code:${ip}`, 5, 60_000)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many attempts. Please wait a minute.' }, { status: 429 })
  }

  try {
    const { code, noteId, email } = await req.json()

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

    // Fetch note pdf_path from DB
    const supabase = getAdminSupabase()
    const { data: note, error: noteErr } = await supabase
      .from('notes')
      .select('id, title, pdf_path, price')
      .eq('id', noteId)
      .single()

    if (noteErr || !note) {
      return NextResponse.json({ error: 'Note not found.' }, { status: 404 })
    }

    // Generate 1-hour signed URL for immediate download
    const { data, error } = await supabase.storage
      .from('notes')
      .createSignedUrl(note.pdf_path, 3600)

    if (error || !data?.signedUrl) {
      console.error('[verify-code] Supabase storage error:', error)
      return NextResponse.json({ error: 'Could not generate download link.' }, { status: 500 })
    }

    // Save order + send receipt email (non-blocking, best-effort)
    void (async () => {
      try {
        const customerEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''

        await supabase.from('orders').insert({
          type:                'note',
          item_id:             note.id,
          item_title:          note.title,
          amount:              0,
          razorpay_payment_id: null,
          razorpay_order_id:   null,
          customer_email:      customerEmail || null,
          customer_name:       null,
          customer_contact:    null,
          status:              'completed',
          via:                 'member_code',
        })

        if (customerEmail) {
          // Generate 24-hour URL for the receipt email
          const { data: longUrl } = await supabase.storage
            .from('notes')
            .createSignedUrl(note.pdf_path, 86_400)

          if (longUrl?.signedUrl) {
            await sendReceiptEmail({
              to:          customerEmail,
              itemTitle:   note.title,
              amountPaise: 0,
              via:         'member_code',
              type:        'note',
              items:       [{ title: note.title, url: longUrl.signedUrl }],
            })
          }
        }
      } catch (e) {
        console.error('[notes/verify-code] post-download tasks failed:', e)
      }
    })()

    return NextResponse.json({ url: data.signedUrl })
  } catch (err) {
    console.error('[verify-code]', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
