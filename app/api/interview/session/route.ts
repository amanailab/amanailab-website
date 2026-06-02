import { NextResponse } from 'next/server'
import { callAI } from '@/lib/ai-fallback'
import { enforceRateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: Request) {
  const limited = enforceRateLimit(req, 'interview-session', 10, 60_000)
  if (limited) return limited
  try {
    const { topic, level, count = 5 } = await req.json()
    if (!topic || !level) {
      return NextResponse.json({ error: 'topic and level are required.' }, { status: 400 })
    }

    const safeCount = Math.min(Math.max(Number(count) || 5, 3), 7)

    const raw = (await callAI({
      messages: [
          {
            role: 'system',
            content:
              'You are a senior AI/ML technical interviewer at a top AI company. Generate unique, non-repetitive, high-quality interview questions that probe real understanding. Return ONLY valid JSON. No markdown.',
          },
          {
            role: 'user',
            content: `Generate exactly ${safeCount} unique ${level}-level technical interview questions about ${topic}.

Return this exact JSON:
{
  "questions": ["question 1 text", "question 2 text", ...]
}

Rules:
- Questions must be different from each other, no overlap
- Each question should probe a distinct concept or skill
- ${level === 'Fresher' ? 'Focus on definitions, basic concepts, and simple scenarios' : level === 'Mid' ? 'Focus on practical implementation, trade-offs, and real-world scenarios' : 'Focus on system design, advanced internals, edge cases, and deep expertise'}
- Questions should be clear and specific, 1-2 sentences each
- No numbering in the question text itself`,
          },
        ],
      temperature: 0.85,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    })).trim()
    const parsed = JSON.parse(raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, ''))

    const questions = Array.isArray(parsed.questions) ? parsed.questions : []
    return NextResponse.json({ questions })
  } catch (err) {
    console.error('[Session Generate]', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
