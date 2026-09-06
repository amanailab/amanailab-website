import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getAdminSupabase } from '@/lib/admin'
import { cookies } from 'next/headers'
import { verifyAdminSession, signEmailToken } from '@/lib/auth-tokens'

export const runtime = 'nodejs'
export const maxDuration = 60

const resend = new Resend(process.env.RESEND_API_KEY)

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://amanailab.com'

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function buildHtml(subject: string, htmlBody: string, previewText: string, email: string, token: string): string {
  const unsubscribeUrl = `${SITE_URL}/api/email/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`
  const previewDiv = previewText
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${previewText}</div>`
    : ''

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
${previewDiv}
  <div style="max-width:600px;margin:0 auto;padding:40px 20px">
    <div style="margin-bottom:32px">
      <span style="font-size:20px;font-weight:700;color:#f4f4f5">Aman<span style="color:#f97316">AI</span> Lab</span>
    </div>
    <div style="background:#18181b;border:1px solid #27272a;border-radius:12px;padding:32px">
      <h1 style="margin:0 0 24px 0;font-size:22px;font-weight:700;color:#f4f4f5;line-height:1.3">${escHtml(subject)}</h1>
      ${htmlBody}
    </div>
    <div style="margin-top:24px;padding-top:24px;border-top:1px solid #27272a;text-align:center">
      <p style="margin:0;font-size:12px;color:#52525b">You are receiving this because you subscribed at amanailab.com</p>
      <p style="margin:8px 0 0 0;font-size:12px;color:#52525b">© ${new Date().getFullYear()} AmanAI Lab</p>
      <p style="margin:8px 0 0 0;font-size:12px">
        <a href="${unsubscribeUrl}" style="color:#71717a;text-decoration:underline">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>`
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies()
    if (!(await verifyAdminSession(cookieStore.get('admin_session')?.value))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { subject, body, previewText } = await req.json()

    if (!subject?.trim() || !body?.trim()) {
      return NextResponse.json({ error: 'Subject and body are required.' }, { status: 400 })
    }

    const supabase = getAdminSupabase()
    const [{ data: subscribers, error: subErr }, { data: waitlist, error: wlErr }] = await Promise.all([
      supabase.from('newsletter_subscribers').select('email'),
      supabase.from('course_waitlist').select('email'),
    ])

    if (subErr) console.error('[newsletter/send] subscribers error:', subErr.message)
    if (wlErr)  console.error('[newsletter/send] waitlist error:', wlErr.message)

    // Merge + deduplicate both lists
    const allEmails = new Set<string>()
    for (const s of subscribers ?? []) if (s.email) allEmails.add(s.email.toLowerCase())
    for (const w of waitlist ?? [])    if (w.email) allEmails.add(w.email.toLowerCase())

    if (allEmails.size === 0) {
      return NextResponse.json({ error: 'No subscribers or waitlist entries found.' }, { status: 400 })
    }

    const emails = [...allEmails]

    const htmlBody = body
      .split('\n')
      .map((line: string) => line.trim() ? `<p style="margin:0 0 12px 0;color:#d4d4d8;font-size:15px;line-height:1.6">${escHtml(line)}</p>` : '<br>')
      .join('')

    const BATCH_SIZE = 50
    let sent = 0
    let failed = 0

    for (let i = 0; i < emails.length; i += BATCH_SIZE) {
      const batch = emails.slice(i, i + BATCH_SIZE)
      const results = await Promise.allSettled(
        batch.map(async (email: string) =>
          resend.emails.send({
            from: 'AmanAI Lab <onboarding@resend.dev>',
            to: email,
            subject,
            html: buildHtml(subject, htmlBody, previewText ?? '', email, await signEmailToken(email)),
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
