import { NextResponse } from 'next/server'
import { callAI } from '@/lib/ai-fallback'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: Request) {
  try {
  const { checkRateLimit, getClientIp } = await import('@/lib/rate-limit')
  const { allowed, retryAfterSec } = checkRateLimit(`${getClientIp(req)}:offer`, 5, 60_000)
  if (!allowed) {
    return NextResponse.json(
      { error: `Too many requests. Please wait ${retryAfterSec} seconds.` },
      { status: 429, headers: { 'Retry-After': String(retryAfterSec) } }
    )
  }


    const { offerText, targetRole, location, yearsOfExperience } = await req.json()

    if (!offerText?.trim()) {
      return NextResponse.json({ error: 'Offer letter content is required.' }, { status: 400 })
    }

    const raw = (await callAI({
      messages: [
          {
            role: 'system',
            content: 'You are an expert career advisor and compensation analyst specializing in AI/ML roles. Analyze offer letters and provide actionable advice. Return ONLY valid JSON. No markdown fences.',
          },
          {
            role: 'user',
            content: `Analyze this job offer letter for an AI/ML role.

Role: ${targetRole || 'Not specified'}
Location: ${location || 'Not specified'}
Years of Experience: ${yearsOfExperience || 'Not specified'}

Offer Letter:
${offerText.slice(0, 4000)}

Return this exact JSON:
{
  "overallVerdict": "Strong Offer | Fair Offer | Below Market | Red Flags Found",
  "overallScore": number 0-100,
  "summary": "2-3 sentence overall assessment",
  "compensation": {
    "baseSalary": "extracted or 'Not mentioned'",
    "equity": "extracted or 'Not mentioned'",
    "bonus": "extracted or 'Not mentioned'",
    "benefits": ["benefit 1", "benefit 2"],
    "marketComparison": "Above Market | At Market | Below Market",
    "marketNote": "brief context on market rates for this role/location"
  },
  "redFlags": ["red flag 1 if any"],
  "greenFlags": ["positive aspect 1", "positive aspect 2"],
  "missingClauses": ["missing clause 1", "missing clause 2"],
  "negotiationScript": "Word-for-word script to negotiate a better offer",
  "questionsToAsk": ["question 1", "question 2", "question 3"],
  "recommendation": "Accept | Negotiate | Decline",
  "recommendationReason": "2-3 sentences explaining the recommendation"
}`,
          },
        ],
      temperature: 0.3,
      max_tokens: 2500,
      response_format: { type: 'json_object' },
    })).trim()
    const result = JSON.parse(raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, ''))
    return NextResponse.json(result)
  } catch (err) {
    console.error('[offer-analyze]', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
