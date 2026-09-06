import { NextResponse } from 'next/server'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export const runtime = 'nodejs'

const PRICES = { early: 799900, regular: 999900 } // paise

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const rl = checkRateLimit(`mc-order:${ip}`, 5, 60_000)
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

  try {
    const { tier } = await req.json()
    const amount = PRICES[tier as 'early' | 'regular'] ?? PRICES.regular

    const keyId     = process.env.RAZORPAY_KEY_ID?.trim()
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim()
    if (!keyId || !keySecret) return NextResponse.json({ error: 'Payment not configured.' }, { status: 500 })

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64')
    const res  = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        currency:        'INR',
        receipt:         `mc_${tier}_${Date.now()}`,
        payment_capture: 1,
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      return NextResponse.json({ error: err?.error?.description ?? 'Failed to create order.' }, { status: 502 })
    }

    const order = await res.json()
    return NextResponse.json({ id: order.id, amount: order.amount, currency: order.currency, key: keyId })
  } catch (e) {
    console.error('[masterclass/create-order]', e)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
