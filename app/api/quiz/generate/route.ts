import { NextResponse } from 'next/server'

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

    const safeCount = Math.min(Math.max(Number(count) || 5, 3), 10)

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
            content: 'You are an AI/ML quiz generator. Generate accurate multiple choice questions. Return ONLY valid JSON. No markdown fences.',
          },
          {
            role: 'user',
            content: `Generate ${safeCount} multiple choice questions about ${topic} at ${level} level for AI/ML practitioners.

Return this exact JSON:
{
  "questions": [
    {
      "id": 1,
      "question": "clear question text",
      "options": ["A. option one", "B. option two", "C. option three", "D. option four"],
      "correctIndex": 0,
      "explanation": "brief explanation of why the answer is correct and others are wrong"
    }
  ]
}

Rules:
- correctIndex is 0-based (0=A, 1=B, 2=C, 3=D)
- Questions must be factually accurate
- ${level === 'Fresher' ? 'Focus on basic definitions and concepts' : level === 'Mid' ? 'Focus on practical application and trade-offs' : 'Focus on advanced internals, system design and nuance'}
- Each question must have exactly 4 options`,
          },
        ],
        temperature: 0.5,
        max_tokens: 3000,
        response_format: { type: 'json_object' },
      }),
    })

    if (!groqRes.ok) {
      return NextResponse.json({ error: 'Failed to generate quiz.' }, { status: 500 })
    }

    const groqData = await groqRes.json()
    const raw = groqData.choices?.[0]?.message?.content?.trim() ?? ''

    const result = JSON.parse(raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, ''))
    return NextResponse.json(result)
  } catch (err) {
    console.error('[Quiz Generate]', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
