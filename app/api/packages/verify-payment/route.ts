import { NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { getAdminSupabase } from '@/lib/admin'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const rl = checkRateLimit(`pkg-verify:${ip}`, 10, 60_000)
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

  try {
    const { packageId, paymentId, orderId, signature } = await req.json()
    if (!packageId || !paymentId || !orderId || !signature) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
    }

    const keyId     = process.env.RAZORPAY_KEY_ID?.trim()
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim()
    if (!keySecret) return NextResponse.json({ error: 'Payment not configured.' }, { status: 500 })

    // Verify HMAC signature — primary security check
    const expected = createHmac('sha256', keySecret).update(`${orderId}|${paymentId}`).digest('hex')
    if (expected !== signature) {
      return NextResponse.json({ error: 'Payment verification failed.' }, { status: 400 })
    }

    // Confirm payment was captured via Razorpay API
    if (keyId) {
      try {
        const auth   = Buffer.from(`${keyId}:${keySecret}`).toString('base64')
        const payRes = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
          headers: { Authorization: `Basic ${auth}` },
        })
        if (payRes.ok) {
          const payment = await payRes.json()
          const paid = payment.status === 'captured' || payment.status === 'authorized'
          if (!paid) {
            return NextResponse.json(
              { error: `Payment not completed (status: ${payment.status}). Please try again.` },
              { status: 400 },
            )
          }
        }
      } catch { /* proceed on valid HMAC if Razorpay API is unreachable */ }
    }

    // Fetch package note_ids
    const supabase = getAdminSupabase()
    const { data: pkg, error: pkgErr } = await supabase
      .from('packages')
      .select('note_ids')
      .eq('id', packageId)
      .single()

    if (pkgErr || !pkg?.note_ids?.length) {
      return NextResponse.json({ error: 'Package not found.' }, { status: 404 })
    }

    // Fetch notes in the package
    const { data: notes } = await supabase
      .from('notes')
      .select('id, title, pdf_path')
      .in('id', pkg.note_ids)

    if (!notes?.length) {
      return NextResponse.json({ error: 'Package has no notes.' }, { status: 404 })
    }

    // Generate 1-hour signed URLs for each note PDF
    const items: { title: string; url: string }[] = []
    for (const note of notes) {
      const { data } = await supabase.storage.from('notes').createSignedUrl(note.pdf_path, 3600)
      if (data?.signedUrl) items.push({ title: note.title, url: data.signedUrl })
    }

    return NextResponse.json({ items })
  } catch (err) {
    console.error('[pkg/verify-payment]', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
