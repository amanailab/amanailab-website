import { NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { Resend } from 'resend'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { getAdminSupabase } from '@/lib/admin'
import { DIWALI_PLANS } from '@/lib/diwali-config'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const rl = checkRateLimit(`dw-verify:${ip}`, 8, 60_000)
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = await req.json()
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment fields.' }, { status: 400 })
    }

    const keyId = process.env.RAZORPAY_KEY_ID?.trim()
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim()
    if (!keyId || !keySecret) return NextResponse.json({ error: 'Payment not configured.' }, { status: 500 })

    const expected = createHmac('sha256', keySecret).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex')
    const a = Buffer.from(expected)
    const b = Buffer.from(String(razorpay_signature))
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return NextResponse.json({ error: 'Invalid payment signature.' }, { status: 400 })
    }

    // Read the order we created ourselves: email, plan and amount come from Razorpay, not the browser.
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64')
    const orderRes = await fetch(`https://api.razorpay.com/v1/orders/${encodeURIComponent(razorpay_order_id)}`, {
      headers: { Authorization: `Basic ${auth}` },
    })
    if (!orderRes.ok) return NextResponse.json({ error: 'Could not verify order.' }, { status: 502 })
    const order = await orderRes.json()
    const email = String(order?.notes?.email ?? '').toLowerCase()
    const plan = order?.notes?.plan as keyof typeof DIWALI_PLANS
    if (!email || !(plan in DIWALI_PLANS) || order.amount !== DIWALI_PLANS[plan].paise) {
      return NextResponse.json({ error: 'Order mismatch.' }, { status: 400 })
    }

    const supabase = getAdminSupabase()
    const { data: row, error } = await supabase
      .from('diwali_applications')
      .update({
        status: 'paid',
        payment_plan: plan,
        amount_paid: order.amount,
        razorpay_order_id,
        razorpay_payment_id,
        paid_at: new Date().toISOString(),
      })
      .eq('email', email)
      .select('name, whatsapp')
      .maybeSingle()
    if (error) {
      console.error('[diwali/verify-payment] update error:', error.message)
      return NextResponse.json({ error: 'Payment received but saving failed. Please contact Aman on WhatsApp.' }, { status: 500 })
    }

    try {
      if (process.env.RESEND_API_KEY && process.env.CONTACT_EMAIL) {
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: 'onboarding@resend.dev',
          to: process.env.CONTACT_EMAIL,
          subject: `Diwali seat PAID (${plan}): ${row?.name ?? email}`,
          html: `<p><strong>${row?.name ?? ''}</strong> (${email}) paid Rs ${order.amount / 100} (${plan}).</p>
                 <p>WhatsApp: ${row?.whatsapp ?? ''}</p><p>Payment ID: ${razorpay_payment_id}</p>`,
        })
      }
    } catch (mailErr) {
      console.warn('[diwali/verify-payment] alert email failed', mailErr)
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[diwali/verify-payment]', e)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
