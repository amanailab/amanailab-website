import { NextResponse } from 'next/server'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export const runtime = 'nodejs'

const SESSIONS: Record<string, { label: string; amount: number }> = {
  quick:    { label: 'Quick Chat (30 min)',               amount: 299  },
  mock:     { label: 'Mock Interview (60 min)',            amount: 999  },
  feedback: { label: 'Mock Interview + Feedback Report',  amount: 1499 },
}

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const rl = checkRateLimit(`booking-order:${ip}`, 10, 60_000)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  try {
    const { sessionType } = await req.json()
    const session = SESSIONS[sessionType]
    if (!session) {
      return NextResponse.json({ error: 'Invalid session type.' }, { status: 400 })
    }

    const keyId     = process.env.RAZORPAY_KEY_ID?.trim()
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim()
    if (!keyId || !keySecret) {
      return NextResponse.json({ error: 'Payment not configured.' }, { status: 500 })
    }

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64')
    const res  = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount:   session.amount * 100,
        currency: 'INR',
        receipt:  `booking_${sessionType}_${Date.now()}`,
        notes:    { session_type: sessionType, session_label: session.label },
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      console.error('[booking/create-order] Razorpay error:', err)
      return NextResponse.json({ error: 'Failed to create payment order.' }, { status: 502 })
    }

    const order = await res.json()
    return NextResponse.json({
      id:       order.id,
      amount:   order.amount,
      currency: order.currency,
      label:    session.label,
    })
  } catch (err) {
    console.error('[booking/create-order]', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
