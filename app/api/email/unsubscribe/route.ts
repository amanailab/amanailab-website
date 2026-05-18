// GET /api/email/unsubscribe?email=xxx
// Marks subscriber as unverified (effectively unsubscribes them)
import { NextRequest, NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/admin'

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')
  if (!email) {
    return new NextResponse('Missing email', { status: 400 })
  }
  const supabase = getAdminSupabase()
  await supabase.from('newsletter_subscribers').update({ verified: false }).eq('email', email.toLowerCase())
  // Show a simple confirmation page
  return new NextResponse(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Unsubscribed</title></head><body style="font-family:sans-serif;background:#09090b;color:#f4f4f5;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0"><div style="text-align:center;padding:40px"><h1 style="font-size:24px;margin-bottom:8px">You've been unsubscribed</h1><p style="color:#71717a;font-size:14px">You won't receive any more emails from AmanAI Lab.</p><a href="https://amanailab.com" style="display:inline-block;margin-top:24px;color:#f97316;text-decoration:none;font-size:14px">← Back to AmanAI Lab</a></div></body></html>`,
    { headers: { 'Content-Type': 'text/html' } }
  )
}
