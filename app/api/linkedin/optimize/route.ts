import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: Request) {
  try {
  const { checkRateLimit, getClientIp } = await import('@/lib/rate-limit')
  const { allowed, retryAfterSec } = checkRateLimit(`${getClientIp(req)}:linkedin-opt`, 6, 60_000)
  if (!allowed) {
    return NextResponse.json(
      { error: `Too many requests. Please wait ${retryAfterSec} seconds.` },
      { status: 429, headers: { 'Retry-After': String(retryAfterSec) } }
    )
  }


    const { headline, about, experience, targetRole } = await req.json()

    if (!about?.trim() && !headline?.trim()) {
      return NextResponse.json({ error: 'At least headline or About section is required.' }, { status: 400 })
    }

    const sections = [
      headline ? `Headline: ${headline}` : '',
      about ? `About/Summary:\n${about}` : '',
      experience ? `Experience highlights:\n${experience}` : '',
      targetRole ? `Target role: ${targetRole}` : '',
    ].filter(Boolean).join('\n\n')

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are an expert LinkedIn profile optimizer for AI/ML professionals. Return ONLY valid JSON. No markdown fences.',
          },
          {
            role: 'user',
            content: `Optimize this LinkedIn profile for maximum recruiter appeal and keyword density in the AI/ML space.

${sections}

Return this exact JSON:
{
  "optimizedHeadline": "improved headline (under 220 chars, keyword-rich)",
  "optimizedAbout": "rewritten About section (2000 chars max, strong opening hook, keywords woven in, first-person, ends with CTA)",
  "keywordsAdded": ["list of important keywords/skills added"],
  "improvements": ["3-5 specific changes made and why"],
  "profileStrengthScore": number 0-100,
  "profileStrengthLabel": "Beginner|Intermediate|All-Star",
  "quickTips": ["3 quick tips to further improve the profile"]
}`,
          },
        ],
        temperature: 0.4,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      }),
    })

    if (!groqRes.ok) {
      return NextResponse.json({ error: 'Failed to optimize profile.' }, { status: 500 })
    }

    const groqData = await groqRes.json()
    const raw = groqData.choices?.[0]?.message?.content?.trim() ?? ''

    const result = JSON.parse(raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, ''))
    return NextResponse.json(result)
  } catch (err) {
    console.error('[LinkedIn Optimize]', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
