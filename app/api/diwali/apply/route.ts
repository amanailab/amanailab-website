import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getAdminSupabase } from '@/lib/admin'
import { enforceRateLimit } from '@/lib/rate-limit'
import { applicationsClosed } from '@/lib/diwali-config'

function esc(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

const clean = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max)

export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, 'diwali-apply', 5, 10 * 60_000)
  if (limited) return limited

  try {
    if (applicationsClosed()) {
      return NextResponse.json({ error: 'Applications for this cohort are closed.' }, { status: 400 })
    }

    const body = await req.json()
    const name = clean(body.name, 100)
    const email = clean(body.email, 200).toLowerCase()
    const whatsapp = clean(body.whatsapp, 20)
    const role = clean(body.role, 120)
    const experience = clean(body.experience, 40)
    const pythonLevel = clean(body.pythonLevel, 40)
    const goal = clean(body.goal, 600)
    const why = clean(body.why, 1000)

    if (!name || !email || !whatsapp) {
      return NextResponse.json({ error: 'Name, email and WhatsApp number are required.' }, { status: 400 })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
    }
    const digits = whatsapp.replace(/\D/g, '')
    if (digits.length < 10 || digits.length > 15) {
      return NextResponse.json({ error: 'Please enter a valid WhatsApp number.' }, { status: 400 })
    }

    const supabase = getAdminSupabase()
    const { error } = await supabase.from('diwali_applications').insert({
      name,
      email,
      whatsapp: digits,
      role: role || null,
      experience: experience || null,
      python_level: pythonLevel || null,
      goal: goal || null,
      why: why || null,
    })

    if (error) {
      // Already applied with this email: acknowledge, no duplicate
      if (error.code === '23505') return NextResponse.json({ ok: true, duplicate: true })
      console.error('diwali apply error:', error)
      return NextResponse.json({ error: 'Could not save your application. Please try again.' }, { status: 500 })
    }

    // Best-effort alert email to the site owner
    try {
      if (process.env.RESEND_API_KEY && process.env.CONTACT_EMAIL) {
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: 'onboarding@resend.dev',
          to: process.env.CONTACT_EMAIL,
          replyTo: email,
          subject: `New Diwali AI Accelerator application: ${name}`,
          html: `
            <h2>New Diwali AI Accelerator application</h2>
            <p><strong>Name:</strong> ${esc(name)}</p>
            <p><strong>Email:</strong> ${esc(email)}</p>
            <p><strong>WhatsApp:</strong> <a href="https://wa.me/${digits}">${esc(whatsapp)}</a></p>
            <p><strong>Role:</strong> ${esc(role)}</p>
            <p><strong>Experience:</strong> ${esc(experience)}</p>
            <p><strong>Python level:</strong> ${esc(pythonLevel)}</p>
            <p><strong>Goal:</strong> ${esc(goal)}</p>
            <p><strong>Why join:</strong> ${esc(why)}</p>
          `,
        })
      }
    } catch (mailErr) {
      console.warn('diwali apply: alert email failed', mailErr)
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('diwali apply exception:', e)
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 })
  }
}
