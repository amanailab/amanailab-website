import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export const runtime = 'nodejs'

const PRICE_INR = 1499

export async function POST(req: Request) {
  const rl = checkRateLimit(`sd-bundle-order:${getClientIp(req)}`, 5, 60_000)
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 })

    const keyId     = process.env.RAZORPAY_KEY_ID?.trim()
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim()
    if (!keyId || !keySecret) return NextResponse.json({ error: 'Payment not configured.' }, { status: 500 })

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64')
    const res  = await fetch('https://api.razorpay.com/v1/orders', {
      method:  'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        amount:          PRICE_INR * 100,
        currency:        'INR',
        receipt:         `bundle_${user.id.slice(0, 8)}_${Date.now()}`,
        payment_capture: 1,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return NextResponse.json({ error: (err as { error?: { description?: string } })?.error?.description ?? 'Failed to create order.' }, { status: 502 })
    }

    const order = await res.json()
    return NextResponse.json({ id: order.id, amount: order.amount, currency: order.currency, key: keyId })
  } catch (err) {
    console.error('[sd-pro/create-bundle-order]', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
