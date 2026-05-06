import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')?.trim()

  if (!token) {
    return NextResponse.redirect(new URL('/verify-email?status=invalid', req.url))
  }

  const supabase = getAdminSupabase()

  const { data: subscriber, error } = await supabase
    .from('newsletter_subscribers')
    .select('id, email, verified, token_expires_at')
    .eq('verification_token', token)
    .maybeSingle()

  if (error || !subscriber) {
    return NextResponse.redirect(new URL('/verify-email?status=invalid', req.url))
  }

  if (subscriber.verified) {
    return NextResponse.redirect(new URL('/verify-email?status=already', req.url))
  }

  if (subscriber.token_expires_at && new Date(subscriber.token_expires_at) < new Date()) {
    return NextResponse.redirect(new URL('/verify-email?status=expired', req.url))
  }

  const { error: updateErr } = await supabase
    .from('newsletter_subscribers')
    .update({
      verified: true,
      verification_token: null,
      token_expires_at: null,
    })
    .eq('id', subscriber.id)

  if (updateErr) {
    console.error('[confirm]', updateErr)
    return NextResponse.redirect(new URL('/verify-email?status=error', req.url))
  }

  return NextResponse.redirect(new URL('/verify-email?status=success', req.url))
}
