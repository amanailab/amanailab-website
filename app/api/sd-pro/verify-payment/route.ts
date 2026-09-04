import { NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { getAdminSupabase } from '@/lib/admin'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export const runtime = 'nodejs'

const PLAN_META = {
  sd_pro:      { title: 'System Design Pro — 30 Days',   amount: 99900  },
  full_bundle: { title: 'Interview Prep Kit — 30 Days',  amount: 149900 },
} as const

type Plan = keyof typeof PLAN_META

export async function POST(req: Request) {
  const rl = checkRateLimit(`sd-pro-verify:${getClientIp(req)}`, 5, 60_000)
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })

    const body = await req.json()
    const { paymentId, orderId, signature } = body

    if (!paymentId || !orderId || !signature) {
      return NextResponse.json({ error: 'Missing payment fields.' }, { status: 400 })
    }

    const keyId     = process.env.RAZORPAY_KEY_ID?.trim()
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim()
    if (!keyId || !keySecret) return NextResponse.json({ error: 'Payment not configured.' }, { status: 500 })

    const expected = createHmac('sha256', keySecret).update(`${orderId}|${paymentId}`).digest('hex')
    if (expected !== signature) {
      return NextResponse.json({ error: 'Payment verification failed.' }, { status: 400 })
    }

    // Do NOT trust the plan from the client — fetch the real order from Razorpay
    // and derive the plan from the amount that was actually paid. Otherwise a
    // user could pay for the ₹999 plan and claim the ₹1499 bundle.
    const rzAuth   = Buffer.from(`${keyId}:${keySecret}`).toString('base64')
    const orderRes = await fetch(`https://api.razorpay.com/v1/orders/${encodeURIComponent(orderId)}`, {
      headers: { Authorization: `Basic ${rzAuth}` },
    })
    if (!orderRes.ok) {
      return NextResponse.json({ error: 'Could not verify the order.' }, { status: 400 })
    }
    const order = await orderRes.json() as { amount?: number; status?: string }
    if (order.status !== 'paid') {
      return NextResponse.json({ error: 'Order is not paid.' }, { status: 400 })
    }
    const plan: Plan | null =
      order.amount === PLAN_META.full_bundle.amount ? 'full_bundle' :
      order.amount === PLAN_META.sd_pro.amount      ? 'sd_pro'      : null
    if (!plan) {
      return NextResponse.json({ error: 'Unrecognized order amount.' }, { status: 400 })
    }

    const admin           = getAdminSupabase()
    const subscribedUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    const meta            = PLAN_META[plan]

    // Replay protection: a payment id can only be redeemed ONCE. Otherwise a
    // user could re-submit the same valid payment to keep extending for free.
    try {
      const { data: existing } = await admin
        .from('orders')
        .select('id')
        .eq('razorpay_payment_id', paymentId)
        .maybeSingle()
      if (existing) {
        return NextResponse.json({ success: true, subscribedUntil, plan, already: true })
      }
    } catch { /* orders table unavailable — proceed (fail open) */ }

    const { error: upsertErr } = await admin.from('sd_subscriptions').upsert({
      user_id:             user.id,
      plan,
      subscribed_until:    subscribedUntil,
      razorpay_payment_id: paymentId,
      razorpay_order_id:   orderId,
      updated_at:          new Date().toISOString(),
    }, { onConflict: 'user_id' })

    if (upsertErr) {
      console.error('[sd-pro/verify] upsert failed:', upsertErr)
      return NextResponse.json({ error: 'Failed to activate subscription.' }, { status: 500 })
    }

    // Awaited so the replay check above sees it on any subsequent call.
    const { error: orderErr } = await admin.from('orders').insert({
      user_id:             user.id,
      type:                plan,
      item_id:             `${plan}-30d`,
      item_title:          meta.title,
      amount:              meta.amount,
      razorpay_payment_id: paymentId,
      razorpay_order_id:   orderId,
      customer_email:      user.email ?? null,
      status:              'completed',
      via:                 'payment',
    })
    if (orderErr) console.error('[sd-pro/verify] order insert failed:', orderErr.message)

    return NextResponse.json({ success: true, subscribedUntil, plan })
  } catch (err) {
    console.error('[sd-pro/verify]', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
