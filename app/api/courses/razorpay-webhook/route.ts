import { NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { getAdminSupabase } from '@/lib/admin'

export const runtime = 'nodejs'

// Safety net: if a student pays but closes the tab before /verify-payment runs, Razorpay still calls this
// webhook (event `order.paid`) and we enrol them from the order notes set in create-order.
// Setup: Razorpay Dashboard → Webhooks → URL https://<site>/api/courses/razorpay-webhook, event order.paid,
// and put the secret in RAZORPAY_WEBHOOK_SECRET.
export async function POST(req: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim()
  if (!secret) return NextResponse.json({ error: 'Webhook not configured.' }, { status: 503 })

  const raw = await req.text()
  const sig = req.headers.get('x-razorpay-signature') ?? ''
  const expected = createHmac('sha256', secret).update(raw).digest('hex')
  const a = Buffer.from(expected), b = Buffer.from(sig)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return NextResponse.json({ error: 'Bad signature.' }, { status: 400 })

  const evt = JSON.parse(raw)
  if (evt.event !== 'order.paid') return NextResponse.json({ ok: true })

  const order = evt.payload?.order?.entity
  const payment = evt.payload?.payment?.entity
  const courseId = order?.notes?.course_id
  const userId = order?.notes?.user_id
  if (!courseId || !userId) return NextResponse.json({ ok: true }) // not a course order

  const sb = getAdminSupabase()
  const { data: course } = await sb.from('courses').select('price').eq('id', courseId).maybeSingle()
  if (!course || Number(order.amount_paid) < Math.round(Number(course.price) * 100)) {
    console.warn('[razorpay-webhook] amount mismatch', order?.id)
    return NextResponse.json({ ok: true })
  }

  const { error } = await sb.from('enrollments').insert({
    user_id: userId, course_id: courseId,
    stripe_payment_id: payment?.id ?? null, razorpay_order_id: order.id,
    amount_paid: Number(order.amount_paid) / 100,
  })
  if (error && error.code !== '23505') {
    console.error('[razorpay-webhook] enroll failed', error.message)
    return NextResponse.json({ error: 'retry' }, { status: 500 }) // non-2xx → Razorpay retries
  }
  return NextResponse.json({ ok: true })
}
