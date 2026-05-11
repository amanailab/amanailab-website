import { NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/admin'
import { Resend } from 'resend'

export const runtime = 'nodejs'
export const maxDuration = 60

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized calls
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getAdminSupabase()

  // Get each user's most recent session
  const { data: sessions } = await supabase
    .from('user_interview_sessions')
    .select('user_id, created_at')
    .order('created_at', { ascending: false })

  if (!sessions?.length) return NextResponse.json({ sent: 0 })

  // Group — keep only the latest session per user
  const lastByUser: Record<string, Date> = {}
  for (const s of sessions) {
    if (!lastByUser[s.user_id]) lastByUser[s.user_id] = new Date(s.created_at)
  }

  // Get all users from auth
  const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 })

  const now  = Date.now()
  const sent: string[] = []
  const errors: string[] = []

  for (const user of users) {
    if (!user.email) continue
    const lastSession = lastByUser[user.id]
    if (!lastSession) continue

    const hoursAgo = (now - lastSession.getTime()) / 3600000

    // Send if 48–72 hours since last session (streak at risk)
    if (hoursAgo < 48 || hoursAgo >= 72) continue

    const namePrefix = user.email.split('@')[0]
    const hoursRounded = Math.round(hoursAgo)

    try {
      await resend.emails.send({
        from: 'AmanAI Lab <onboarding@resend.dev>',
        to: user.email,
        subject: `⚡ Your streak is at risk — practice for 10 minutes`,
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;padding:0 20px;">

    <div style="background:#18181b;border:1px solid #27272a;border-radius:16px;overflow:hidden;">
      <!-- Orange top bar -->
      <div style="height:3px;background:linear-gradient(90deg,#f97316,#fb923c,#f97316)"></div>

      <div style="padding:32px;">
        <!-- Header -->
        <p style="margin:0 0 4px;font-size:13px;color:#71717a;font-weight:600;text-transform:uppercase;letter-spacing:1px;">AmanAI Lab</p>
        <h1 style="margin:0 0 20px;font-size:22px;font-weight:800;color:#f4f4f5;line-height:1.3;">
          ⚡ Don't break your streak, ${namePrefix}
        </h1>
        <p style="margin:0 0 20px;font-size:15px;color:#a1a1aa;line-height:1.6;">
          It's been <strong style="color:#f4f4f5">${hoursRounded} hours</strong> since your last practice session.
          Just 10 minutes today keeps your progress going.
        </p>

        <!-- CTA button -->
        <a href="https://amanailab.com/interview"
           style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;font-size:14px;font-weight:700;padding:14px 28px;border-radius:12px;margin-bottom:24px;">
          Practice Now →
        </a>

        <!-- Quick links -->
        <div style="border-top:1px solid #27272a;padding-top:20px;margin-top:4px;">
          <p style="margin:0 0 12px;font-size:12px;color:#52525b;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Or explore</p>
          <div style="display:flex;gap:10px;flex-wrap:wrap;">
            <a href="https://amanailab.com/companies" style="color:#f97316;font-size:13px;text-decoration:none;font-weight:600;">Company Prep</a>
            <span style="color:#3f3f46">·</span>
            <a href="https://amanailab.com/questions" style="color:#f97316;font-size:13px;text-decoration:none;font-weight:600;">Question Bank</a>
            <span style="color:#3f3f46">·</span>
            <a href="https://amanailab.com/dashboard" style="color:#f97316;font-size:13px;text-decoration:none;font-weight:600;">My Dashboard</a>
          </div>
        </div>
      </div>
    </div>

    <p style="text-align:center;margin-top:20px;font-size:11px;color:#3f3f46;">
      AmanAI Lab · Free AI/ML Interview Preparation ·
      <a href="https://amanailab.com" style="color:#52525b;text-decoration:none;">amanailab.com</a>
    </p>
  </div>
</body>
</html>`,
      })
      sent.push(user.email)
    } catch (e) {
      errors.push(user.email)
      console.error('[streak-reminder] email failed:', user.email, e)
    }
  }

  console.info(`[streak-reminder] sent=${sent.length} errors=${errors.length}`)
  return NextResponse.json({ sent: sent.length, errors: errors.length })
}
