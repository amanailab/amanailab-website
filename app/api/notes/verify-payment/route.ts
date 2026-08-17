import { NextResponse }  from 'next/server'
import { createHmac }    from 'crypto'
import { getAdminSupabase } from '@/lib/admin'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const rl = checkRateLimit(`notes-verify:${ip}`, 10, 60_000)
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

  try {
    const { noteId, paymentId, orderId, signature } = await req.json()

    if (!noteId || !paymentId || !orderId || !signature) {
      return NextResponse.json({ error: 'Missing required payment fields.' }, { status: 400 })
    }

    const keyId     = process.env.RAZORPAY_KEY_ID?.trim()
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim()
    if (!keyId || !keySecret) {
      console.error('[notes/verify-payment] RAZORPAY keys not set')
      return NextResponse.json({ error: 'Payment not configured.' }, { status: 500 })
    }

    // Step 1: Verify HMAC-SHA256 signature
    const body     = `${orderId}|${paymentId}`
    const expected = createHmac('sha256', keySecret).update(body).digest('hex')

    console.log('[notes/verify-payment] orderId:', orderId, '| paymentId:', paymentId)
    console.log('[notes/verify-payment] signature match:', expected === signature)

    if (expected !== signature) {
      return NextResponse.json({ error: 'Payment verification failed.' }, { status: 400 })
    }

    // Step 2: Fetch payment from Razorpay to confirm status is captured/authorized
    const auth   = Buffer.from(`${keyId}:${keySecret}`).toString('base64')
    const payRes = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Basic ${auth}` },
    })

    if (!payRes.ok) {
      console.error('[notes/verify-payment] Could not fetch payment from Razorpay:', paymentId)
      return NextResponse.json({ error: 'Could not confirm payment with Razorpay.' }, { status: 502 })
    }

    const payment = await payRes.json()

    if (payment.status !== 'captured' && payment.status !== 'authorized') {
      console.error('[notes/verify-payment] Payment not captured. Status:', payment.status, 'paymentId:', paymentId)
      return NextResponse.json({ error: `Payment not captured (status: ${payment.status}).` }, { status: 400 })
    }

    // Step 3: Fetch note pdf_path from DB
    const supabase = getAdminSupabase()
    const { data: note, error: noteErr } = await supabase
      .from('notes')
      .select('pdf_path')
      .eq('id', noteId)
      .single()

    if (noteErr || !note) {
      return NextResponse.json({ error: 'Note not found.' }, { status: 404 })
    }

    // Generate 1-hour signed URL
    const { data, error } = await supabase.storage
      .from('notes')
      .createSignedUrl(note.pdf_path, 3600)

    if (error || !data?.signedUrl) {
      console.error('[notes/verify-payment] Supabase storage error:', error)
      return NextResponse.json({ error: 'Could not generate download link.' }, { status: 500 })
    }

    return NextResponse.json({ url: data.signedUrl })
  } catch (err) {
    console.error('[notes/verify-payment]', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
