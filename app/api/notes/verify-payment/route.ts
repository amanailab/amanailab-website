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
    if (!keySecret) {
      console.error('[notes/verify-payment] RAZORPAY_KEY_SECRET not set')
      return NextResponse.json({ error: 'Payment not configured.' }, { status: 500 })
    }

    // Step 1: Verify HMAC-SHA256 signature — primary security check
    const body     = `${orderId}|${paymentId}`
    const expected = createHmac('sha256', keySecret).update(body).digest('hex')

    console.log('[notes/verify-payment] orderId:', orderId, '| paymentId:', paymentId)
    console.log('[notes/verify-payment] signature match:', expected === signature)

    if (expected !== signature) {
      return NextResponse.json({ error: 'Payment verification failed.' }, { status: 400 })
    }

    // Step 2: Optionally confirm payment status via Razorpay API (fail-open).
    // If the API is unreachable we still honour the payment — the HMAC above is
    // cryptographic proof that Razorpay initiated the transaction. We only block
    // if the payment is definitively in a failed or un-started state.
    if (keyId) {
      try {
        const auth   = Buffer.from(`${keyId}:${keySecret}`).toString('base64')
        const payRes = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
          headers: { Authorization: `Basic ${auth}` },
        })
        if (payRes.ok) {
          const payment = await payRes.json()
          if (payment.status === 'failed' || payment.status === 'created') {
            console.error('[notes/verify-payment] Payment in invalid state:', payment.status, paymentId)
            return NextResponse.json({ error: `Payment ${payment.status} — please try again.` }, { status: 400 })
          }
          console.log('[notes/verify-payment] Payment status confirmed:', payment.status, paymentId)
        } else {
          console.warn('[notes/verify-payment] Could not fetch payment status, proceeding on valid signature:', paymentId)
        }
      } catch (fetchErr) {
        console.warn('[notes/verify-payment] Razorpay status check error, proceeding:', fetchErr)
      }
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
