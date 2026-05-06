import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getAdminSupabase } from '@/lib/admin'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'
export const maxDuration = 60

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies()
    const session = cookieStore.get('admin_session')?.value
    if (session !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { subject, body, previewText } = await req.json()

    if (!subject?.trim() || !body?.trim()) {
      return NextResponse.json({ error: 'Subject and body are required.' }, { status: 400 })
    }

    const supabase = getAdminSupabase()
    const { data: subscribers, error } = await supabase
      .from('newsletter_subscribers')
      .select('email')
      .eq('verified', true)   // only send to verified emails

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch subscribers.' }, { status: 500 })
    }

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({ error: 'No verified subscribers found.' }, { status: 400 })
    }

    const emails = subscribers.map((s: { email: string }) => s.email)

    const htmlBody = body
      .split('\n')
      .map((line: string) => line.trim() ? `<p style="margin:0 0 12px 0;color:#d4d4d8;font-size:15px;line-height:1.6">${line}</p>` : '<br>')
      .join('')

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px">
    <div style="margin-bottom:32px">
      <span style="font-size:20px;font-weight:700;color:#f4f4f5">Aman<span style="color:#f97316">AI</span> Lab</span>
    </div>
    <div style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:32px">
      <h1 style="margin:0 0 24px 0;font-size:22px;font-weight:700;color:#f4f4f5;line-height:1.3">${subject}</h1>
      ${htmlBody}
    </div>
    <div style="margin-top:24px;padding-top:24px;border-top:1px solid #27272a;text-align:center">
      <p style="margin:0;font-size:12px;color:#52525b">You are receiving this because you subscribed at amanailab.com</p>
      <p style="margin:8px 0 0 0;font-size:12px;color:#52525b">© 2025 AmanAI Lab</p>
    </div>
  </div>
</body>
</html>`

    const BATCH_SIZE = 50
    let sent = 0
    let failed = 0

    for (let i = 0; i < emails.length; i += BATCH_SIZE) {
      const batch = emails.slice(i, i + BATCH_SIZE)
      const results = await Promise.allSettled(
        batch.map((email: string) =>
          resend.emails.send({
            from: 'AmanAI Lab <newsletter@amanailab.com>',
            to: email,
            subject,
            html,
            ...(previewText ? { headers: { 'X-Preview-Text': previewText } } : {}),
          })
        )
      )
      results.forEach((r) => (r.status === 'fulfilled' ? sent++ : failed++))
    }

    return NextResponse.json({ sent, failed, total: emails.length })
  } catch (err) {
    console.error('[Newsletter Send]', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
