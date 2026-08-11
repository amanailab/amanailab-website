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

    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim()
    if (!keySecret) {
      return NextResponse.json({ error: 'Payment not configured.' }, { status: 500 })
    }

    const body     = `${orderId}|${paymentId}`
    const expected = createHmac('sha256', keySecret).update(body).digest('hex')

    if (expected !== signature) {
      return NextResponse.json({ error: 'Payment verification failed.' }, { status: 400 })
    }

    return NextResponse.json({ success: true, paymentId })
  } catch (err) {
    console.error('[booking/verify-payment]', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
