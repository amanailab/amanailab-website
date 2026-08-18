import { NextResponse } from 'next/server'
import { createHmac }   from 'crypto'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const rl = checkRateLimit(`booking-verify:${ip}`, 10, 60_000)
  if (!rl.allowed) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

  try {
    const { paymentId, orderId, signature, sessionType } = await req.json()

    if (!paymentId || !orderId || !signature || !sessionType) {
      return NextResponse.json({ error: 'Missing required payment fields.' }, { status: 400 })
    }

    const keyId     = process.env.RAZORPAY_KEY_ID?.trim()
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim()
    if (!keySecret) {
      return NextResponse.json({ error: 'Payment not configured.' }, { status: 500 })
    }

    // Step 1: Verify HMAC-SHA256 signature — this is the primary security check
    const body     = `${orderId}|${paymentId}`
    const expected = createHmac('sha256', keySecret).update(body).digest('hex')

    if (expected !== signature) {
      console.error('[booking/verify-payment] Signature mismatch for orderId:', orderId)
      return NextResponse.json({ error: 'Payment verification failed.' }, { status: 400 })
    }

    // Step 2: Confirm the payment was actually captured via the Razorpay API.
    // When the API is reachable we REQUIRE the money to have moved: status must be
    // 'captured' (auto-capture) or 'authorized'. Anything else (created, failed,
    // refunded…) is rejected so we never show "paid" without real money.
    // Only if the API itself is unreachable do we fall back to the HMAC signature,
    // which is still cryptographic proof that Razorpay generated this payment.
    if (keyId) {
      try {
        const auth   = Buffer.from(`${keyId}:${keySecret}`).toString('base64')
        const payRes = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
          headers: { Authorization: `Basic ${auth}` },
        })
        if (payRes.ok) {
          const payment = await payRes.json()
          const paid = payment.status === 'captured' || payment.status === 'authorized'
          if (!paid) {
            console.error('[booking/verify-payment] Payment not captured:', payment.status, paymentId)
            return NextResponse.json({ error: `Payment not completed (status: ${payment.status}). Please try again.` }, { status: 400 })
          }
          console.log('[booking/verify-payment] Payment captured:', payment.status, paymentId)
        } else {
          console.warn('[booking/verify-payment] Could not fetch payment status, proceeding on valid signature:', paymentId)
        }
      } catch (fetchErr) {
        console.warn('[booking/verify-payment] Razorpay status check error, proceeding:', fetchErr)
      }
    }

    return NextResponse.json({ success: true, paymentId })
  } catch (err) {
    console.error('[booking/verify-payment]', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
