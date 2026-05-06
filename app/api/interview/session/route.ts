import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const { topic, level, count = 5 } = await req.json()
    if (!topic || !level) {
      return NextResponse.json({ error: 'topic and level are required.' }, { status: 400 })
    }

    const safeCount = Math.min(Math.max(Number(count) || 5, 3), 7)

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
            content:
              'You are an expert AI/ML technical interviewer. Generate unique, non-repetitive interview questions. Return ONLY valid JSON. No markdown fences.',
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
      }),
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to generate questions.' }, { status: 502 })
    }

    const data = await res.json()
    const raw = data.choices?.[0]?.message?.content?.trim() ?? ''
    const parsed = JSON.parse(raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, ''))

    return NextResponse.json({ questions: parsed.questions ?? [] })
  } catch (err) {
    console.error('[Session Generate]', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
