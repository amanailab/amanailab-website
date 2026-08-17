import { NextResponse } from 'next/server'
import { createHmac }   from 'crypto'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const rl = checkRateLimit(`booking-verify:${ip}`, 10, 60_000)
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

  try {
    const { paymentId, orderId, signature, sessionType } = await req.json()

    if (!paymentId || !orderId || !signature || !sessionType) {
      return NextResponse.json({ error: 'Missing required payment fields.' }, { status: 400 })
    }

    const keyId     = process.env.RAZORPAY_KEY_ID?.trim()
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim()
    if (!keyId || !keySecret) {
      return NextResponse.json({ error: 'Payment not configured.' }, { status: 500 })
    }

    // Step 1: Verify HMAC-SHA256 signature
    const body     = `${orderId}|${paymentId}`
    const expected = createHmac('sha256', keySecret).update(body).digest('hex')

    if (expected !== signature) {
      console.error('[booking/verify-payment] Signature mismatch for orderId:', orderId)
      return NextResponse.json({ error: 'Payment verification failed.' }, { status: 400 })
    }

    // Step 2: Fetch payment from Razorpay to confirm status is captured/authorized
    const auth    = Buffer.from(`${keyId}:${keySecret}`).toString('base64')
    const payRes  = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Basic ${auth}` },
    })

    if (!payRes.ok) {
      console.error('[booking/verify-payment] Could not fetch payment from Razorpay:', paymentId)
      return NextResponse.json({ error: 'Could not confirm payment with Razorpay.' }, { status: 502 })
    }

    const payment = await payRes.json()

    if (payment.status !== 'captured' && payment.status !== 'authorized') {
      console.error('[booking/verify-payment] Payment not captured. Status:', payment.status, 'paymentId:', paymentId)
      return NextResponse.json({ error: `Payment not captured (status: ${payment.status}).` }, { status: 400 })
    }

    return NextResponse.json({ success: true, paymentId })
  } catch (err) {
    console.error('[booking/verify-payment]', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
