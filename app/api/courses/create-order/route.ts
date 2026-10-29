import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const rl = checkRateLimit(`course-order:${ip}`, 10, 60_000)
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

  try {
    const { courseId } = await req.json()
    if (!courseId) return NextResponse.json({ error: 'Missing courseId.' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })

    const { data: course, error } = await supabase
      .from('courses')
      .select('id, title, price, currency, is_published, is_free')
      .eq('id', courseId)
      .single()

    if (error || !course) return NextResponse.json({ error: 'Course not found.' }, { status: 404 })
    if (!course.is_published) return NextResponse.json({ error: 'Course not available.' }, { status: 404 })
    if (course.is_free) return NextResponse.json({ error: 'Course is free — enroll directly.' }, { status: 400 })

    // Check not already enrolled
    const { data: existing } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .maybeSingle()
    if (existing) return NextResponse.json({ error: 'Already enrolled.' }, { status: 400 })

    const keyId     = process.env.RAZORPAY_KEY_ID?.trim()
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim()
    if (!keyId || !keySecret) return NextResponse.json({ error: 'Payment not configured.' }, { status: 500 })

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64')
    const res  = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount:          Math.round(course.price * 100), // paise
        currency:        'INR',
        receipt:         `course_${courseId}_${Date.now()}`,
        payment_capture: 1,
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      return NextResponse.json({ error: err?.error?.description ?? 'Failed to create order.' }, { status: 502 })
    }

    const order = await res.json()
    return NextResponse.json({
      id: order.id, amount: order.amount, currency: order.currency,
      key: keyId, email: user.email, courseName: course.title,
    })
  } catch (e) {
    console.error('[courses/create-order]', e)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
