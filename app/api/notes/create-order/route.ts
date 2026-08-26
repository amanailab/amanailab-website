import { NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/admin'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const rl = checkRateLimit(`notes-order:${ip}`, 10, 60_000)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in to purchase.' }, { status: 401 })

  try {
    const { noteId } = await req.json()
    if (!noteId) return NextResponse.json({ error: 'Missing noteId.' }, { status: 400 })

    const supabase = getAdminSupabase()
    const { data: note, error } = await supabase
      .from('notes')
      .select('id, price, title, is_active')
      .eq('id', noteId)
      .single()

    if (error || !note) return NextResponse.json({ error: 'Note not found.' }, { status: 404 })
    if (!note.is_active) return NextResponse.json({ error: 'Note is not available.' }, { status: 404 })

    const keyId     = process.env.RAZORPAY_KEY_ID?.trim()
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim()
    if (!keyId || !keySecret) {
      return NextResponse.json({ error: 'Payment not configured.' }, { status: 500 })
    }

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64')
    const res  = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount:          note.price * 100,
        currency:        'INR',
        receipt:         `note_${noteId}_${Date.now()}`,
        payment_capture: 1,
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      console.error('[create-order] Razorpay error:', err)
      const desc = err?.error?.description ?? 'Failed to create payment order.'
      return NextResponse.json({ error: desc }, { status: 502 })
    }

    const order = await res.json()
    return NextResponse.json({ id: order.id, amount: order.amount, currency: order.currency })
  } catch (err) {
    console.error('[create-order]', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
