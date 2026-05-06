import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const { jd } = await req.json()
    if (!jd || typeof jd !== 'string' || jd.trim().length < 50) {
      return NextResponse.json({ error: 'Please paste a full job description (at least 50 characters).' }, { status: 400 })
    }

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are an expert AI/ML technical recruiter and interview coach. Analyze job descriptions and generate targeted interview questions. Return ONLY valid JSON, no markdown.',
          },
          {
            role: 'user',
            content: `Analyze this job description and return a JSON object with this exact structure:
{
  "role": "extracted job title",
  "company": "company name if mentioned, else null",
  "level": "Fresher|Mid|Senior|Staff|Principal",
  "skills": ["skill1", "skill2", ...],
  "questions": [
    {
      "question": "specific interview question",
      "why": "one sentence: why this question is asked for this role",
      "model_answer": "2-4 sentence ideal answer highlighting key concepts"
    }
  ],
  "study_tips": ["tip1", "tip2", "tip3"]
}

Rules:
- Extract exactly the top 8 most important technical skills
- Generate exactly 6 interview questions that are SPECIFIC to this role (not generic)
- Questions should reflect the actual requirements in the JD
- Model answers should be concise but complete
- 3 study tips specific to gaps or priorities in this role

Job Description:
${jd.slice(0, 4000)}`,
          },
        ],
        temperature: 0.5,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      }),
    })

    if (!res.ok) return NextResponse.json({ error: 'Failed to analyze job description.' }, { status: 502 })

    const data = await res.json()
    const raw = data.choices?.[0]?.message?.content?.trim() ?? ''
    const parsed = JSON.parse(raw)

    return NextResponse.json(parsed)
  } catch (err) {
    console.error('[Job Prep]', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
