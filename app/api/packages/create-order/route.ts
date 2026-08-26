import { NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/admin'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const rl = checkRateLimit(`pkg-order:${ip}`, 10, 60_000)
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

  try {
    const { packageId } = await req.json()
    if (!packageId) return NextResponse.json({ error: 'Missing packageId.' }, { status: 400 })

    const supabase = getAdminSupabase()
    const { data: pkg, error } = await supabase
      .from('packages')
      .select('id, price, title, is_active')
      .eq('id', packageId)
      .single()

    if (error || !pkg) return NextResponse.json({ error: 'Package not found.' }, { status: 404 })
    if (!pkg.is_active) return NextResponse.json({ error: 'Package not available.' }, { status: 404 })

    const keyId     = process.env.RAZORPAY_KEY_ID?.trim()
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim()
    if (!keyId || !keySecret) return NextResponse.json({ error: 'Payment not configured.' }, { status: 500 })

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64')
    const res  = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount:          pkg.price * 100,
        currency:        'INR',
        receipt:         `pkg_${packageId}_${Date.now()}`,
        payment_capture: 1,
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      return NextResponse.json({ error: err?.error?.description ?? 'Failed to create order.' }, { status: 502 })
    }

    const order = await res.json()
    return NextResponse.json({ id: order.id, amount: order.amount, currency: order.currency })
  } catch (err) {
    console.error('[pkg/create-order]', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
