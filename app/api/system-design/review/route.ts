import { NextResponse } from 'next/server'
import { callAI } from '@/lib/ai-fallback'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: Request) {
  const { checkRateLimit, getClientIp } = await import('@/lib/rate-limit')
  const { allowed, retryAfterSec } = checkRateLimit(`${getClientIp(req)}:sd-review`, 5, 60_000)
  if (!allowed) {
    return NextResponse.json(
      { error: `Too many requests. Please wait ${retryAfterSec} seconds.` },
      { status: 429 }
    )
  }

  try {
    const { problem, design } = await req.json()
    if (!problem || !design?.trim()) {
      return NextResponse.json({ error: 'Problem and design are required.' }, { status: 400 })
    }
    if (design.length < 100) {
      return NextResponse.json({ error: 'Design answer is too short. Please write more detail before requesting a review.' }, { status: 400 })
    }

    const raw = await callAI({
      messages: [
        {
          role: 'system',
          content: `You are a senior staff engineer at a top AI company (Google/Meta/OpenAI) conducting ML system design interviews. You give structured, honest, educational feedback on candidate system design answers. You are encouraging but precise — you don't pad feedback with empty praise. Return ONLY valid JSON with no markdown wrapping.`,
        },
        {
          role: 'user',
          content: `Review this system design answer for the following interview question.

PROBLEM:
${problem}

CANDIDATE ANSWER:
${design}

Return JSON in exactly this format:
{
  "overallScore": <integer 1-10>,
  "grade": "<A|B|C|D>",
  "summary": "<2-3 sentence overall assessment>",
  "strengths": ["<specific strength>", "<specific strength>"],
  "gaps": ["<specific missing area or weak reasoning>", "<...>"],
  "sectionScores": {
    "requirements": <1-10 or null if not present>,
    "architecture": <1-10 or null>,
    "scalability": <1-10 or null>,
    "dataModel": <1-10 or null>,
    "tradeoffs": <1-10 or null>
  },
  "topSuggestion": "<single most impactful improvement they should make>",
  "interviewerNote": "<what an interviewer would say after this answer — be specific and realistic>"
}`,
        },
      ],
      temperature: 0.4,
      max_tokens: 900,
      response_format: { type: 'json_object' },
    })

    let review: unknown
    try {
      review = JSON.parse(typeof raw === 'string' ? raw : JSON.stringify(raw))
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI review. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ review })
  } catch (err) {
    console.error('[system-design/review]', err)
    return NextResponse.json({ error: 'Review failed. Please try again in a moment.' }, { status: 500 })
  }
}
