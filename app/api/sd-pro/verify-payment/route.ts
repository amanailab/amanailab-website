import { NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { getAdminSupabase } from '@/lib/admin'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export const runtime = 'nodejs'

const PLAN_META = {
  sd_pro:      { title: 'System Design Pro — 30 Days',   amount: 79900 },
  full_bundle: { title: 'Interview Prep Kit — 30 Days',  amount: 99900 },
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
    const plan: Plan = body.plan === 'full_bundle' ? 'full_bundle' : 'sd_pro'

    if (!paymentId || !orderId || !signature) {
      return NextResponse.json({ error: 'Missing payment fields.' }, { status: 400 })
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim()
    if (!keySecret) return NextResponse.json({ error: 'Payment not configured.' }, { status: 500 })

    const expected = createHmac('sha256', keySecret).update(`${orderId}|${paymentId}`).digest('hex')
    if (expected !== signature) {
      return NextResponse.json({ error: 'Payment verification failed.' }, { status: 400 })
    }

    const admin           = getAdminSupabase()
    const subscribedUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    const meta            = PLAN_META[plan]

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

    void admin.from('orders').insert({
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

    return NextResponse.json({ success: true, subscribedUntil, plan })
  } catch (err) {
    console.error('[sd-pro/verify]', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
