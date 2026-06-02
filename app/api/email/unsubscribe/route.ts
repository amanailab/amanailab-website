// GET /api/email/unsubscribe?email=xxx&token=yyy
// Marks subscriber as unverified (effectively unsubscribes them).
// Requires a signed token bound to the email so attackers can't unsubscribe
// arbitrary addresses by guessing them.
import { NextRequest, NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/admin'
import { verifyEmailToken } from '@/lib/auth-tokens'

function page(heading: string, message: string): NextResponse {
  return new NextResponse(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${heading}</title></head><body style="font-family:sans-serif;background:#09090b;color:#f4f4f5;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0"><div style="text-align:center;padding:40px"><h1 style="font-size:24px;margin-bottom:8px">${heading}</h1><p style="color:#71717a;font-size:14px">${message}</p><a href="https://amanailab.com" style="display:inline-block;margin-top:24px;color:#f97316;text-decoration:none;font-size:14px">← Back to AmanAI Lab</a></div></body></html>`,
    { headers: { 'Content-Type': 'text/html' } },
  )
}

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')
  const token = req.nextUrl.searchParams.get('token')
  if (!email) {
    return new NextResponse('Missing email', { status: 400 })
  }
  if (!(await verifyEmailToken(email, token))) {
    return page('Invalid unsubscribe link', 'This link is invalid or has expired. Please use the unsubscribe link from a recent email.')
  }
  const supabase = getAdminSupabase()
  await supabase.from('newsletter_subscribers').update({ verified: false }).eq('email', email.toLowerCase())
  return page("You've been unsubscribed", "You won't receive any more emails from AmanAI Lab.")
}
