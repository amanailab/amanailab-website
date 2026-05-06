import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const { companyName, targetRole } = await req.json()

    if (!companyName?.trim()) {
      return NextResponse.json({ error: 'Company name is required.' }, { status: 400 })
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
            content: 'You are an expert career advisor with deep knowledge of tech companies and their AI/ML hiring processes. Provide detailed company research to help candidates prepare. Return ONLY valid JSON. No markdown fences.',
          },
          {
            role: 'user',
            content: `Research ${companyName} for a candidate applying for ${targetRole || 'an AI/ML role'}.

Return this exact JSON:
{
  "companyOverview": "3-4 sentence overview of the company, its AI/ML focus, and why it matters",
  "aiMlFocus": "What AI/ML work they actually do — products, research, scale",
  "techStack": ["technology 1", "technology 2", "technology 3", "technology 4", "technology 5"],
  "interviewProcess": [
    { "round": "Round name", "description": "What happens in this round", "tips": "How to prepare" }
  ],
  "cultureSignals": ["culture point 1", "culture point 2", "culture point 3"],
  "topicsToStudy": ["topic 1", "topic 2", "topic 3", "topic 4"],
  "commonInterviewQuestions": ["question 1", "question 2", "question 3"],
  "questionsToAskThem": ["question 1", "question 2", "question 3"],
  "salaryRange": "Estimated range for ${targetRole || 'AI/ML role'} at this company",
  "prosAndCons": {
    "pros": ["pro 1", "pro 2", "pro 3"],
    "cons": ["con 1", "con 2"]
  },
  "insiderTips": ["tip 1", "tip 2", "tip 3"],
  "disclaimer": "This is AI-generated research based on training data. Verify details on Glassdoor, LinkedIn, and the company website."
}

Be specific and accurate based on what you know about ${companyName}. Focus on AI/ML roles.`,
          },
        ],
        temperature: 0.4,
        max_tokens: 2500,
        response_format: { type: 'json_object' },
      }),
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to research company.' }, { status: 500 })
    }

    const data = await res.json()
    const raw = data.choices?.[0]?.message?.content?.trim() ?? ''
    const result = JSON.parse(raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, ''))
    return NextResponse.json(result)
  } catch (err) {
    console.error('[company-research]', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
