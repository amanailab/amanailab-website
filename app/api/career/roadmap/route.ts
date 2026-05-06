import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const { currentSkills, targetRole, timePerWeek, currentLevel } = await req.json()

    if (!targetRole?.trim()) {
      return NextResponse.json({ error: 'Target role is required.' }, { status: 400 })
    }

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
            content: 'You are an expert AI/ML career coach. Generate personalized, actionable career roadmaps. Return ONLY valid JSON. No markdown fences.',
          },
          {
            role: 'user',
            content: `Create a detailed career roadmap for someone who wants to become a ${targetRole}.

Current Skills: ${currentSkills || 'Not specified'}
Current Level: ${currentLevel || 'Beginner'}
Available Time: ${timePerWeek || '10'} hours per week

Return this exact JSON:
{
  "totalDuration": "e.g. 6 months",
  "overview": "2-3 sentence summary of the roadmap",
  "phases": [
    {
      "phase": 1,
      "title": "Phase title",
      "duration": "e.g. 4 weeks",
      "goal": "What you'll achieve",
      "topics": ["topic 1", "topic 2", "topic 3"],
      "resources": ["resource name 1", "resource name 2"],
      "milestone": "Measurable outcome to check completion",
      "projects": ["project idea 1"]
    }
  ],
  "keySkills": ["skill 1", "skill 2", "skill 3", "skill 4", "skill 5"],
  "jobReadySignals": ["signal 1", "signal 2", "signal 3"],
  "tips": ["tip 1", "tip 2", "tip 3"]
}

Generate 4-6 phases. Be specific and actionable. Focus on AI/ML ecosystem tools and real resources.`,
          },
        ],
        temperature: 0.4,
        max_tokens: 3000,
        response_format: { type: 'json_object' },
      }),
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to generate roadmap.' }, { status: 500 })
    }

    const data = await res.json()
    const raw = data.choices?.[0]?.message?.content?.trim() ?? ''
    const result = JSON.parse(raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, ''))
    return NextResponse.json(result)
  } catch (err) {
    console.error('[roadmap]', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
