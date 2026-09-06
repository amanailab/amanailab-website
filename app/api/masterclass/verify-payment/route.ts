import { NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { getAdminSupabase } from '@/lib/admin'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const rl = checkRateLimit(`mc-verify:${ip}`, 5, 60_000)
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, tier, name, email, whatsapp } = await req.json()

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment fields.' }, { status: 400 })
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim()
    if (!keySecret) return NextResponse.json({ error: 'Payment not configured.' }, { status: 500 })

    // Verify HMAC signature
    const expected = createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    if (expected !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid payment signature.' }, { status: 400 })
    }

    // Get logged-in user if any
    let userId: string | null = null
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      userId = user?.id ?? null
    } catch { /* not logged in — fine */ }

    const amountPaise = tier === 'early' ? 799900 : 999900
    const finalEmail  = email?.trim().toLowerCase() || null

    const admin = getAdminSupabase()

    const record = {
      email:               finalEmail,
      name:                name?.trim() || null,
      whatsapp:            whatsapp?.trim() || null,
      tier,
      via:                 'payment',
      amount:              amountPaise,
      razorpay_payment_id,
      razorpay_order_id,
      status:              'paid',
    }

    // Try with user_id first (requires SQL migration); fall back without it
    const { error } = await admin
      .from('masterclass_registrations')
      .upsert({ ...record, user_id: userId }, { onConflict: 'email' })

    if (error) {
      console.error('[masterclass/verify-payment] upsert error:', error.message)
      // If user_id column missing (migration not run), save without it
      const { error: e2 } = await admin
        .from('masterclass_registrations')
        .upsert(record, { onConflict: 'email' })
      if (e2) console.error('[masterclass/verify-payment] fallback error:', e2.message)
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[masterclass/verify-payment]', e)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
