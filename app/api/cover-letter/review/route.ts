import { NextResponse } from 'next/server'
import { callAI } from '@/lib/ai-fallback'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: Request) {
  try {
  const { checkRateLimit, getClientIp } = await import('@/lib/rate-limit')
  const { allowed, retryAfterSec } = checkRateLimit(`${getClientIp(req)}:cover-letter`, 6, 60_000)
  if (!allowed) {
    return NextResponse.json(
      { error: `Too many requests. Please wait ${retryAfterSec} seconds.` },
      { status: 429, headers: { 'Retry-After': String(retryAfterSec) } }
    )
  }


    const { coverLetter, jobDescription, targetRole } = await req.json()

    if (!coverLetter?.trim()) {
      return NextResponse.json({ error: 'Cover letter is required.' }, { status: 400 })
    }
    if (!jobDescription?.trim()) {
      return NextResponse.json({ error: 'Job description is required.' }, { status: 400 })
    }

    const raw = (await callAI({
      messages: [
          {
            role: 'system',
            content: 'You are an expert cover letter reviewer and career coach. Analyze cover letters against job descriptions. Return ONLY valid JSON. No markdown fences.',
          },
          {
            role: 'user',
            content: `Review this cover letter against the job description and provide detailed feedback.

Target Role: ${targetRole || 'Not specified'}

Job Description:
${jobDescription.slice(0, 3000)}

Cover Letter:
${coverLetter.slice(0, 3000)}

Return this exact JSON:
{
  "overallScore": number 0-100,
  "grade": "A|B|C|D|F",
  "summary": "2-3 sentence overall assessment",
  "strengths": ["3-5 things done well"],
  "weaknesses": ["3-5 things to improve"],
  "missingKeywords": ["important keywords from JD missing in cover letter"],
  "toneAnalysis": { "label": "Professional|Too Casual|Too Formal|Too Generic", "suggestion": "one sentence fix" },
  "lengthAnalysis": { "verdict": "Too Short|Good Length|Too Long", "suggestion": "one sentence" },
  "improvedVersion": "complete rewritten cover letter optimized for this JD (300-400 words)",
  "quickFixes": ["3 immediate changes to make right now"]
}`,
          },
        ],
      temperature: 0.3,
      max_tokens: 2500,
      response_format: { type: 'json_object' },
    })).trim()

    const result = JSON.parse(raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, ''))
    return NextResponse.json(result)
  } catch (err) {
    console.error('[Cover Letter Review]', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
