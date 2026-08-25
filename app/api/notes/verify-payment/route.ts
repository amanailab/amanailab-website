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
      return NextResponse.json({ error: 'Payment not configured.' }, { status: 500 })
    }

    // Step 1: Verify HMAC-SHA256 signature
    const body     = `${orderId}|${paymentId}`
    const expected = createHmac('sha256', keySecret).update(body).digest('hex')
    if (expected !== signature) {
      return NextResponse.json({ error: 'Payment verification failed.' }, { status: 400 })
    }

    // Step 2: Confirm payment captured + extract customer details
    let customerEmail   = ''
    let customerName    = ''
    let customerContact = ''
    let amountPaise     = 0

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
          customerEmail   = payment.email   ?? ''
          customerContact = payment.contact ?? ''
          customerName    = payment.notes?.name ?? ''
          amountPaise     = payment.amount  ?? 0
        }
      } catch {
        // proceed on valid HMAC if Razorpay API is unreachable
      }
    }

    // Step 3: Fetch note
    const supabase = getAdminSupabase()
    const { data: note, error: noteErr } = await supabase
      .from('notes')
      .select('id, title, pdf_path, price')
      .eq('id', noteId)
      .single()

    if (noteErr || !note) {
      return NextResponse.json({ error: 'Note not found.' }, { status: 404 })
    }

    if (!amountPaise) amountPaise = (note.price ?? 0) * 100

    // Step 4: Generate 1-hour URL for immediate download modal
    const { data: shortUrl, error: shortErr } = await supabase.storage
      .from('notes')
      .createSignedUrl(note.pdf_path, 3600)

    if (shortErr || !shortUrl?.signedUrl) {
      return NextResponse.json({ error: 'Could not generate download link.' }, { status: 500 })
    }

    // Step 5: Save order (non-blocking, best-effort)
    void supabase.from('orders').insert({
      type:                 'note',
      item_id:              note.id,
      item_title:           note.title,
      amount:               amountPaise,
      razorpay_payment_id:  paymentId,
      razorpay_order_id:    orderId,
      customer_email:       customerEmail   || null,
      customer_name:        customerName    || null,
      customer_contact:     customerContact || null,
      status:               'completed',
      via:                  'payment',
    }).then(({ error }) => {
      if (error) console.error('[notes/verify-payment] order insert failed:', error)
    })

    return NextResponse.json({ url: shortUrl.signedUrl })
  } catch (err) {
    console.error('[notes/verify-payment]', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
