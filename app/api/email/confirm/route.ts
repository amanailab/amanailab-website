import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
}

function redirect(status: string, req: Request) {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin
  return NextResponse.redirect(`${base}/verify-email?status=${status}`)
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')?.trim()

  if (!token) {
    return redirect('invalid', req)
  }

  const supabase = getAdminSupabase()

  const { data: subscriber, error } = await supabase
    .from('newsletter_subscribers')
    .select('id, verified, token_expires_at')
    .eq('verification_token', token)
    .maybeSingle()

  if (error) {
    console.error('[confirm] lookup error:', error)
    return redirect('error', req)
  }

  if (!subscriber) {
    return redirect('invalid', req)
  }

  if (subscriber.verified) {
    return redirect('already', req)
  }

  if (subscriber.token_expires_at && new Date(subscriber.token_expires_at) < new Date()) {
    return redirect('expired', req)
  }

  const { error: updateErr } = await supabase
    .from('newsletter_subscribers')
    .update({ verified: true, verification_token: null, token_expires_at: null })
    .eq('id', subscriber.id)

  if (updateErr) {
    console.error('[confirm] update error:', updateErr)
    return redirect('error', req)
  }

  return redirect('success', req)
}
