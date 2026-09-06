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

    // Base fields (no user_id — works even if migration not run)
    const baseFields = {
      via:                 'payment',
      status:              'paid',
      amount:              amountPaise,
      razorpay_payment_id,
      razorpay_order_id,
      ...(name?.trim()     ? { name: name.trim() }         : {}),
      ...(whatsapp?.trim() ? { whatsapp: whatsapp.trim() } : {}),
    }
    // Fields with user_id (requires migration)
    const fieldsWithUser = userId ? { ...baseFields, user_id: userId } : baseFields

    async function savePayment(fields: typeof baseFields) {
      if (finalEmail) {
        // Try to update existing row first (covers interest_form → paid upgrade)
        const { data: updated, error: updateErr } = await admin
          .from('masterclass_registrations')
          .update(fields)
          .eq('email', finalEmail)
          .select('id')

        if (updateErr) {
          console.error('[masterclass/verify-payment] update error:', updateErr.message)
          return false
        }

        // No existing row — insert fresh
        if (!updated || updated.length === 0) {
          const { error: insertErr } = await admin
            .from('masterclass_registrations')
            .insert({ email: finalEmail, tier, ...fields })
          if (insertErr) {
            console.error('[masterclass/verify-payment] insert error:', insertErr.message)
            return false
          }
        }
      } else {
        const { error: insertErr } = await admin
          .from('masterclass_registrations')
          .insert({ tier, ...fields })
        if (insertErr) {
          console.error('[masterclass/verify-payment] no-email insert error:', insertErr.message)
          return false
        }
      }
      return true
    }

    // Try with user_id first; if column missing fall back to base fields
    const ok = await savePayment(fieldsWithUser)
    if (!ok && userId) {
      console.warn('[masterclass/verify-payment] retrying without user_id (migration pending)')
      await savePayment(baseFields)
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[masterclass/verify-payment]', e)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
