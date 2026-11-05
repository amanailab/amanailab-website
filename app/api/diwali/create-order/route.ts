import { NextResponse } from 'next/server'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { getAdminSupabase } from '@/lib/admin'
import { DIWALI, DIWALI_PLANS, type DiwaliPlan } from '@/lib/diwali-config'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const rl = checkRateLimit(`dw-order:${ip}`, 8, 60_000)
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

  try {
    const { email, plan } = await req.json()
    const cleanEmail = String(email ?? '').trim().toLowerCase()
    if (!cleanEmail || !(plan in DIWALI_PLANS)) {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
    }

    const keyId = process.env.RAZORPAY_KEY_ID?.trim()
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim()
    if (!keyId || !keySecret) return NextResponse.json({ error: 'Payment not configured.' }, { status: 500 })

    const supabase = getAdminSupabase()
    const { data: app } = await supabase
      .from('diwali_applications')
      .select('id, name, whatsapp, status')
      .eq('email', cleanEmail)
      .maybeSingle()

    if (!app) return NextResponse.json({ error: 'Please submit the application form first, using the same email.' }, { status: 400 })
    if (app.status === 'paid') return NextResponse.json({ error: 'Your seat is already confirmed.' }, { status: 400 })
    if (app.status === 'rejected') return NextResponse.json({ error: 'This application is not eligible for payment.' }, { status: 400 })

    // Seats: selected/paid applicants hold a seat. Don't take money when full.
    const { count } = await supabase
      .from('diwali_applications')
      .select('id', { count: 'exact', head: true })
      .in('status', ['selected', 'paid'])
      .neq('id', app.id)
    const holdsSeat = app.status === 'selected'
    if (!holdsSeat && (count ?? 0) >= DIWALI.totalSeats) {
      return NextResponse.json({ error: 'All seats are taken. Message Aman on WhatsApp to join the waitlist.' }, { status: 409 })
    }

    const amount = DIWALI_PLANS[plan as DiwaliPlan].paise
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64')
    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        currency: 'INR',
        receipt: `dw_${app.id}_${Date.now()}`,
        payment_capture: 1,
        notes: { email: cleanEmail, plan, app_id: String(app.id) },
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return NextResponse.json({ error: err?.error?.description ?? 'Failed to create order.' }, { status: 502 })
    }
    const order = await res.json()
    return NextResponse.json({
      id: order.id, amount: order.amount, currency: order.currency, key: keyId,
      name: app.name, contact: app.whatsapp,
    })
  } catch (e) {
    console.error('[diwali/create-order]', e)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
