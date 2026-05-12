import { NextResponse } from 'next/server'
import { callAI } from '@/lib/ai-fallback'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: Request) {
  const { checkRateLimit, getClientIp } = await import('@/lib/rate-limit')
  const { allowed, retryAfterSec } = checkRateLimit(`${getClientIp(req)}:quiz`, 8, 60_000)
  if (!allowed) {
    return NextResponse.json(
      { error: `Too many requests. Please wait ${retryAfterSec} seconds.` },
      { status: 429, headers: { 'Retry-After': String(retryAfterSec) } }
    )
  }

  try {
    const { topic, level, count = 5 } = await req.json()

    if (!topic || !level) {
      return NextResponse.json({ error: 'Topic and level are required.' }, { status: 400 })
    }

    const safeCount = Math.min(Math.max(Number(count) || 5, 3), 15)

    const raw = (await callAI({
      messages: [
          {
            role: 'system',
            content: `You are a world-class AI/ML interview coach creating MCQ questions used by engineers at top AI companies. Your questions are precise, educational, varied in style, and based on real interview patterns. Return ONLY valid JSON. No markdown.`,
          },
          {
            role: 'user',
            content: `Generate ${safeCount} high-quality MCQ questions about ${topic} at ${level} level.

Level:
${level === 'Fresher' ? '- Core definitions, basic concepts, vocabulary, simple scenarios' : ''}
${level === 'Mid' ? '- Practical trade-offs, when to use X vs Y, implementation details, common pitfalls' : ''}
${level === 'Senior' ? '- Deep internals, architecture decisions, production challenges, scaling, edge cases' : ''}

Mix question styles: definition, comparison, applied scenario, numerical/formula, troubleshooting.

Return this exact JSON:
{
  "questions": [
    {
      "id": 1,
      "question": "precise question text (1-2 sentences)",
      "options": ["A. option one", "B. option two", "C. option three", "D. option four"],
      "correctIndex": 0,
      "explanation": "2-3 sentences: why correct answer is right, why the most tempting wrong answer is wrong, one practical takeaway"
    }
  ]
}

Rules:
- correctIndex is 0-based (0=A, 1=B, 2=C, 3=D)
- All 4 options must be plausible — no obviously wrong distractors
- Rotate which letter holds the correct answer across questions
- Explanations must be educational, not just restating the answer`,
          },
        ],
      temperature: 0.5,
      max_tokens: 4500,
      response_format: { type: 'json_object' },
    })).trim()

    const result = JSON.parse(raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, ''))
    return NextResponse.json(result)
  } catch (err) {
    console.error('[Quiz Generate]', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
