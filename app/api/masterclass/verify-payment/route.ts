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

    // Get logged-in user if any — links purchase to account
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const amountPaise = tier === 'early' ? 799900 : 999900
    const finalEmail  = email?.trim().toLowerCase() || user?.email?.toLowerCase()

    const admin = getAdminSupabase()
    const { error } = await admin.from('masterclass_registrations').upsert({
      email:               finalEmail,
      name:                name?.trim() || null,
      whatsapp:            whatsapp?.trim() || null,
      tier,
      via:                 'payment',
      amount:              amountPaise,
      razorpay_payment_id,
      razorpay_order_id,
      status:              'paid',
      user_id:             user?.id ?? null,
    }, { onConflict: 'email' })

    if (error) console.error('[masterclass/verify-payment] db error:', error)

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[masterclass/verify-payment]', e)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
