import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: Request) {
  try {
  const { checkRateLimit, getClientIp } = await import('@/lib/rate-limit')
  const { allowed, retryAfterSec } = checkRateLimit(`${getClientIp(req)}:study-plan`, 5, 60_000)
  if (!allowed) {
    return NextResponse.json(
      { error: `Too many requests. Please wait ${retryAfterSec} seconds.` },
      { status: 429, headers: { 'Retry-After': String(retryAfterSec) } }
    )
  }


    const { targetRole, interviewDate, currentLevel, weakTopics, hoursPerDay } = await req.json()

    if (!targetRole?.trim() || !interviewDate?.trim()) {
      return NextResponse.json({ error: 'Target role and interview date are required.' }, { status: 400 })
    }

    const today = new Date()
    const interview = new Date(interviewDate)
    const daysLeft = Math.max(1, Math.ceil((interview.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))

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
            content: 'You are an expert AI/ML interview coach. Generate focused, realistic study plans. Return ONLY valid JSON. No markdown fences.',
          },
          {
            role: 'user',
            content: `Create a study plan for an AI/ML interview.

Target Role: ${targetRole}
Days Until Interview: ${daysLeft} days
Current Level: ${currentLevel || 'Mid'}
Weak Topics: ${weakTopics || 'Not specified'}
Hours Available Per Day: ${hoursPerDay || '2'} hours

Return this exact JSON:
{
  "summary": "2 sentence overview of the plan",
  "totalDays": ${daysLeft},
  "dailyHours": ${hoursPerDay || 2},
  "weeks": [
    {
      "week": 1,
      "focus": "Main focus for this week",
      "days": [
        {
          "day": 1,
          "date": "Day 1",
          "topic": "Topic to study",
          "tasks": ["task 1", "task 2"],
          "practice": "What to practice",
          "timeEstimate": "2 hours"
        }
      ]
    }
  ],
  "priorityTopics": ["topic 1", "topic 2", "topic 3"],
  "dailyRoutine": ["Morning: ...", "Evening: ..."],
  "doNotForget": ["important reminder 1", "important reminder 2", "important reminder 3"]
}

Generate a realistic week-by-week plan fitting ${daysLeft} days. Max 4 weeks. Keep each week's days array to 5-7 days. Focus on AI/ML interview topics.`,
          },
        ],
        temperature: 0.4,
        max_tokens: 3000,
        response_format: { type: 'json_object' },
      }),
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to generate study plan.' }, { status: 500 })
    }

    const data = await res.json()
    const raw = data.choices?.[0]?.message?.content?.trim() ?? ''
    const result = JSON.parse(raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, ''))
    return NextResponse.json(result)
  } catch (err) {
    console.error('[study-plan]', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
