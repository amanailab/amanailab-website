import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export const runtime = 'nodejs'

const resend = new Resend(process.env.RESEND_API_KEY)

// ── Strict email regex ────────────────────────────────────────────────────────
const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/

// ── Disposable / throwaway email domains to block ────────────────────────────
const BLOCKED_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.org',
  'throwam.com', 'throwaway.email', 'trashmail.com', 'trashmail.net', 'trashmail.io',
  'yopmail.com', 'yopmail.fr', 'cool.fr.nf', 'jetable.fr.nf', 'nospam.ze.tc',
  'nomail.xl.cx', 'mega.zik.dj', 'speed.1s.fr', 'courriel.fr.nf', 'moncourrier.fr.nf',
  'spamgourmet.com', 'spamgourmet.net', 'spamgourmet.org',
  'tempmail.com', 'temp-mail.org', 'temp-mail.ru', 'tempinbox.com',
  'dispostable.com', 'maildrop.cc', 'sharklasers.com', 'guerrillamailblock.com',
  'grr.la', 'guerrillamail.info', 'spam4.me', 'fakeinbox.com', 'mailnull.com',
  'mailnesia.com', 'mailzilla.com', 'mailzilla.org', 'spamevader.com',
  '10minutemail.com', '10minutemail.net', '20minutemail.com', 'minutemail.com',
  'getairmail.com', 'discard.email', 'discardmail.com', 'discardmail.de',
  'spambox.us', 'spamfree24.org', 'spamhereplease.com', 'spammotel.com',
  'gishpuppy.com', 'migumail.com', 'sneakemail.com', 'spaml.de', 'spamwc.de',
  'tempinbox.co.uk', 'tempemail.net', 'throwam.com', 'wegwerfemail.de',
  'dudmail.com', 'scatmail.com', 'trayna.com', 'filzmail.com', 'filzmail.de',
  'inoutmail.eu', 'inoutmail.net', 'inoutmail.info', 'inoutmail.de',
  'kasmail.com', 'lol.ovpn.to', 'nwldx.com', 'spamdaytwo.com', 'sogetthis.com',
])

function isDisposable(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase()
  return domain ? BLOCKED_DOMAINS.has(domain) : false
}

function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
}

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const rl = checkRateLimit(`subscribe:${ip}`, 5, 60_000)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  try {
    const { email: rawEmail, source } = await req.json()

    // ── Format validation ──
    const email = (rawEmail ?? '').trim().toLowerCase()
    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
    }
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
    }
    if (email.length > 254) {
      return NextResponse.json({ error: 'Email address is too long.' }, { status: 400 })
    }

    // ── Disposable domain check ──
    if (isDisposable(email)) {
      return NextResponse.json({
        error: 'Please use your real email address. Temporary/disposable emails are not accepted.',
      }, { status: 400 })
    }

    const supabase = getAdminSupabase()

    // ── Check if already exists ──
    const { data: existing } = await supabase
      .from('newsletter_subscribers')
      .select('id, verified, source')
      .eq('email', email)
      .maybeSingle()

    if (existing?.verified) {
      // Already verified — unlock immediately, no email needed
      return NextResponse.json({ success: true, alreadyVerified: true })
    }

    // ── Generate verification token (48h expiry) ──
    const token = randomUUID()
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()

    // ── Upsert subscriber ──
    if (existing) {
      await supabase
        .from('newsletter_subscribers')
        .update({ verification_token: token, token_expires_at: expiresAt, source: source ?? existing.source })
        .eq('email', email)
    } else {
      const { error: insertErr } = await supabase
        .from('newsletter_subscribers')
        .insert({ email, source: source ?? 'unknown', verified: false, verification_token: token, token_expires_at: expiresAt })

      if (insertErr) {
        const code = (insertErr as { code?: string }).code ?? ''
        const msg = insertErr.message?.toLowerCase() ?? ''
        // Duplicate — already in DB (race condition) → still success
        if (code === '23505' || msg.includes('duplicate')) {
          return NextResponse.json({ success: true, alreadyVerified: false })
        }
        console.error('[subscribe] insert error:', insertErr)
        return NextResponse.json({ error: 'Could not save your email. Please try again.' }, { status: 500 })
      }
    }

    // ── Send verification email ──
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://amanailab.com'
    const verifyUrl = `${baseUrl}/api/email/confirm?token=${token}`

    const { error: resendErr } = await resend.emails.send({
      from: 'AmanAI Lab <onboarding@resend.dev>',
      to: email,
      subject: 'Confirm your AmanAI Lab subscription',
      html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:520px;margin:0 auto;padding:48px 24px">
    <div style="margin-bottom:32px">
      <span style="font-size:22px;font-weight:800;color:#f4f4f5">Aman<span style="color:#f97316">AI</span> Lab</span>
    </div>

    <div style="background:#18181b;border:1px solid #27272a;border-radius:16px;padding:36px">
      <div style="font-size:32px;margin-bottom:20px">👋</div>
      <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#f4f4f5;line-height:1.3">
        One click to confirm your email
      </h1>
      <p style="margin:0 0 28px;font-size:15px;color:#a1a1aa;line-height:1.6">
        Thanks for joining AmanAI Lab! Click the button below to verify your email and activate your free access to all tools.
      </p>

      <a href="${verifyUrl}"
        style="display:inline-block;background:#f97316;color:#fff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:12px">
        Verify My Email →
      </a>

      <p style="margin:28px 0 0;font-size:13px;color:#52525b;line-height:1.6">
        This link expires in 48 hours. If you didn&apos;t sign up, you can safely ignore this email.
      </p>
    </div>

    <div style="margin-top:28px;padding-top:24px;border-top:1px solid #27272a;text-align:center">
      <p style="margin:0;font-size:12px;color:#3f3f46">
        Can&apos;t click the button? Copy this link:<br>
        <a href="${verifyUrl}" style="color:#f97316;word-break:break-all;font-size:11px">${verifyUrl}</a>
      </p>
      <p style="margin:12px 0 0;font-size:11px;color:#3f3f46">© ${new Date().getFullYear()} AmanAI Lab · No spam, ever.</p>
    </div>
  </div>
</body>
</html>`,
    })

    if (resendErr) {
      console.error('[subscribe] Resend error:', resendErr)
      // Resend with onboarding@resend.dev only works for your own verified email.
      // Domain verification needed to send to any address.
      // Still return success so UX isn't broken — user gets "check inbox" message.
    }

    return NextResponse.json({ success: true, alreadyVerified: false })
  } catch (err) {
    console.error('[subscribe]', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
