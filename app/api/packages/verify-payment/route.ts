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

    // Step 1: Verify HMAC signature
    const expected = createHmac('sha256', keySecret).update(`${orderId}|${paymentId}`).digest('hex')
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
              { error: `Payment not completed (status: ${payment.status}).` },
              { status: 400 },
            )
          }
          customerEmail   = payment.email   ?? ''
          customerContact = payment.contact ?? ''
          customerName    = payment.notes?.name ?? ''
          amountPaise     = payment.amount  ?? 0
        }
      } catch { /* proceed on valid HMAC */ }
    }

    // Step 3: Fetch package + notes
    const supabase = getAdminSupabase()

    const { data: pkg, error: pkgErr } = await supabase
      .from('packages')
      .select('id, title, note_ids, price')
      .eq('id', packageId)
      .single()

    if (pkgErr || !pkg?.note_ids?.length) {
      return NextResponse.json({ error: 'Package not found.' }, { status: 404 })
    }

    if (!amountPaise) amountPaise = (pkg.price ?? 0) * 100

    const { data: notes } = await supabase
      .from('notes')
      .select('id, title, pdf_path')
      .in('id', pkg.note_ids)

    if (!notes?.length) {
      return NextResponse.json({ error: 'Package has no notes.' }, { status: 404 })
    }

    // Step 4: Generate 1-hour signed URLs in parallel
    const urlResults = await Promise.all(
      notes.map(note => supabase.storage.from('notes').createSignedUrl(note.pdf_path, 3600).then(r => ({ note, url: r.data?.signedUrl ?? null })))
    )
    const items = urlResults
      .filter(r => r.url)
      .map(r => ({ title: r.note.title, url: r.url! }))

    if (!items.length) {
      return NextResponse.json({ error: 'Could not generate download links. Contact support.' }, { status: 500 })
    }

    // Optional: attach the logged-in user's id so purchases show on their dashboard
    let buyerId: string | null = null
    try {
      const { createClient } = await import('@/lib/supabase/server')
      const sb = await createClient()
      buyerId = (await sb.auth.getUser()).data.user?.id ?? null
    } catch { /* anonymous checkout */ }

    // Step 5: Save order (non-blocking, best-effort)
    void supabase.from('orders').insert({
      type:                 'package',
      item_id:              pkg.id,
      item_title:           pkg.title,
      amount:               amountPaise,
      razorpay_payment_id:  paymentId,
      razorpay_order_id:    orderId,
      user_id:              buyerId,
      customer_email:       customerEmail   || null,
      customer_name:        customerName    || null,
      customer_contact:     customerContact || null,
      status:               'completed',
      via:                  'payment',
    }).then(({ error }) => {
      if (error) console.error('[pkg/verify-payment] order insert failed:', error)
    })

    return NextResponse.json({ items })
  } catch (err) {
    console.error('[pkg/verify-payment]', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
