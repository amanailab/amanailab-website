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

    const paymentFields = {
      via:                 'payment',
      status:              'paid',
      amount:              amountPaise,
      razorpay_payment_id,
      razorpay_order_id,
      // update name/whatsapp only if provided
      ...(name?.trim()     ? { name: name.trim() }         : {}),
      ...(whatsapp?.trim() ? { whatsapp: whatsapp.trim() } : {}),
      ...(userId           ? { user_id: userId }           : {}),
    }

    if (finalEmail) {
      // Update existing row (interest_form or prior payment) for this email
      const { data: updated, error: updateErr } = await admin
        .from('masterclass_registrations')
        .update(paymentFields)
        .eq('email', finalEmail)
        .select('id')

      if (updateErr) console.error('[masterclass/verify-payment] update error:', updateErr.message)

      // No existing row → insert fresh
      if (!updateErr && (!updated || updated.length === 0)) {
        const { error: insertErr } = await admin
          .from('masterclass_registrations')
          .insert({ email: finalEmail, tier, ...paymentFields })
        if (insertErr) console.error('[masterclass/verify-payment] insert error:', insertErr.message)
      }
    } else {
      // No email (rare) — insert without email
      const { error: insertErr } = await admin
        .from('masterclass_registrations')
        .insert({ tier, ...paymentFields })
      if (insertErr) console.error('[masterclass/verify-payment] no-email insert error:', insertErr.message)
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[masterclass/verify-payment]', e)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
