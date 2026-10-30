import { NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { getAdminSupabase } from '@/lib/admin'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const rl = checkRateLimit(`course-verify:${ip}`, 10, 60_000)
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, courseId } = await req.json()

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !courseId) {
      return NextResponse.json({ error: 'Missing payment fields.' }, { status: 400 })
    }

    const keyId     = process.env.RAZORPAY_KEY_ID?.trim()
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim()
    if (!keyId || !keySecret) return NextResponse.json({ error: 'Payment not configured.' }, { status: 500 })

    // 1. Verify HMAC signature (constant-time)
    const expected = createHmac('sha256', keySecret).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex')
    const a = Buffer.from(expected), b = Buffer.from(String(razorpay_signature))
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return NextResponse.json({ error: 'Invalid payment signature.' }, { status: 400 })
    }

    // 2. Authenticated user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })

    const admin = getAdminSupabase()

    // 3. A valid signature only proves *some* order was paid. Fetch the order from Razorpay and make sure
    //    it was created for THIS user + THIS course at the CURRENT price (stops paying ₹1 and reusing it).
    const { data: course } = await admin.from('courses').select('id, price, is_published').eq('id', courseId).maybeSingle()
    if (!course) return NextResponse.json({ error: 'Course not found.' }, { status: 404 })

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64')
    const orderRes = await fetch(`https://api.razorpay.com/v1/orders/${encodeURIComponent(razorpay_order_id)}`, {
      headers: { Authorization: `Basic ${auth}` },
    })
    if (!orderRes.ok) return NextResponse.json({ error: 'Could not verify order.' }, { status: 502 })
    const order = await orderRes.json()

    const paidOk =
      order.status === 'paid' &&
      order.notes?.course_id === courseId &&
      order.notes?.user_id === user.id &&
      Number(order.amount_paid) >= Math.round(Number(course.price) * 100) &&
      order.currency === 'INR'
    if (!paidOk) {
      console.warn('[courses/verify-payment] order mismatch', { order: razorpay_order_id, user: user.id, courseId })
      return NextResponse.json({ error: 'Payment does not match this course.' }, { status: 400 })
    }

    // 4. Enrol (service key; browser can no longer insert enrollments)
    const { error } = await admin.from('enrollments').insert({
      user_id:            user.id,
      course_id:          courseId,
      stripe_payment_id:  razorpay_payment_id, // legacy column name — holds the Razorpay payment id
      razorpay_order_id,
      amount_paid:        Number(order.amount_paid) / 100,
    })

    if (error && error.code !== '23505') { // ignore duplicate enrollment
      console.error('[courses/verify-payment] insert error:', error.message)
      return NextResponse.json({ error: 'Failed to enroll.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[courses/verify-payment]', e)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
