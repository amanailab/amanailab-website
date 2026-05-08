import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { company, daysLeft, weakTopics, strongTopics } = await req.json()
    if (!company || !daysLeft) return NextResponse.json({ error: 'company and daysLeft required' }, { status: 400 })

    const days = Math.min(Math.max(Number(daysLeft), 3), 30)

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are an expert AI/ML interview coach. Create a focused day-by-day prep plan. Return ONLY valid JSON, no markdown.',
          },
          {
            role: 'user',
            content: `Create a ${days}-day interview prep plan for ${company}.
Weak topics (prioritize): ${weakTopics?.join(', ') || 'none identified yet'}
Strong topics: ${strongTopics?.join(', ') || 'none yet'}

Return this exact JSON:
{
  "plan": [
    {
      "day": 1,
      "focus": "Topic Name",
      "task": "Specific 1-sentence task description",
      "duration": "45 min",
      "tip": "One quick interview tip for this topic"
    }
  ]
}

Rules:
- Each day has exactly ONE focused topic
- Prioritize weak topics first, then gaps, then review of strong topics
- Last 2 days: mixed review + behavioral questions
- Keep task descriptions actionable and specific`,
          },
        ],
        temperature: 0.4,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      }),
    })

    if (!groqRes.ok) return NextResponse.json({ error: 'AI failed' }, { status: 500 })
    const data = await groqRes.json()
    const raw  = data.choices?.[0]?.message?.content ?? '{}'
    const result = JSON.parse(raw)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[interview-plan]', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
