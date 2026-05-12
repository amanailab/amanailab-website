import { NextResponse } from 'next/server'
import { callAI } from '@/lib/ai-fallback'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const { jd } = await req.json()
    if (!jd || typeof jd !== 'string' || jd.trim().length < 50) {
      return NextResponse.json({ error: 'Please paste a full job description (at least 50 characters).' }, { status: 400 })
    }

    const raw = (await callAI({
      messages: [
          {
            role: 'system',
            content: `You are a senior AI/ML technical recruiter with 10 years at top AI companies (Google, Meta, OpenAI, Anthropic). You deeply understand what each JD actually tests for in interviews. Your questions are specific, your model answers are expert-level, and your study tips are actionable. Return ONLY valid JSON, no markdown.`,
          },
          {
            role: 'user',
            content: `Analyze this job description and extract key interview prep information.

Job Description:
${jd.slice(0, 4000)}

Return this exact JSON:
{
  "role": "exact job title from JD",
  "company": "company name if mentioned, else null",
  "level": "Fresher|Mid|Senior|Staff|Principal",
  "skills": ["top 8 skills in priority order — most critical first, based on what's emphasised in the JD"],
  "questions": [
    {
      "question": "specific, non-generic question directly tied to the JD requirements",
      "why": "one sentence explaining exactly why this company asks this for this role",
      "model_answer": "3-5 sentence expert answer showing deep knowledge — include specific techniques, frameworks, or numbers where relevant"
    }
  ],
  "study_tips": [
    "specific, actionable tip with a resource or technique — not 'review X', but 'build X using Y because this JD emphasises Z'"
  ]
}

Requirements:
- Skills must reflect ACTUAL emphasis in the JD — not generic ML skills
- Questions must feel like they came from a real ${jd.slice(0, 50).split('\n')[0]} interview — not a textbook
- Model answers must demonstrate real expertise, not definitions
- Generate exactly 6 questions and 3 study tips`,
          },
        ],
      temperature: 0.5,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    })).trim()
    const parsed = JSON.parse(raw)

    return NextResponse.json(parsed)
  } catch (err) {
    console.error('[Job Prep]', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
