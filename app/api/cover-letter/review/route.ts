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
            content: `You are a top-tier career coach who has reviewed 10,000+ cover letters and helped candidates land roles at Google, Meta, OpenAI, and top AI startups. You know exactly what hiring managers read in 30 seconds, what makes them stop and call, and what makes them reject. Your feedback is specific, honest, and actionable. The rewrite you produce MUST include the exact keywords from the JD and open with a compelling hook. Return ONLY valid JSON. No markdown.`,
          },
          {
            role: 'user',
            content: `Review this cover letter against the job description with expert-level scrutiny.

Target Role: ${targetRole || 'AI/ML role'}

Job Description:
${jobDescription.slice(0, 3000)}

Cover Letter:
${coverLetter.slice(0, 3000)}

Return this exact JSON:
{
  "overallScore": number 0-100 (90+ = would definitely call, 70-89 = likely call, 50-69 = maybe, <50 = would not call),
  "grade": "A" | "B" | "C" | "D" | "F",
  "summary": "2-3 honest sentences: first sentence states the biggest strength, second states the most critical weakness, third gives the bottom line verdict",
  "strengths": ["3-5 SPECIFIC things done well — quote or reference actual phrases from the letter"],
  "weaknesses": ["3-5 SPECIFIC weaknesses — be honest about what hiring managers actually dislike, e.g. 'opening paragraph uses generic phrases like passionate about technology that every candidate uses'"],
  "missingKeywords": ["important technical keywords from the JD that don't appear in the letter — these hurt ATS scoring"],
  "toneAnalysis": { "label": "Professional|Too Casual|Too Formal|Too Generic|Too Salesy", "suggestion": "specific 1-sentence fix referencing actual phrases in the letter" },
  "lengthAnalysis": { "verdict": "Too Short|Good Length|Too Long", "suggestion": "specific guidance on what to cut or expand" },
  "improvedVersion": "complete rewritten cover letter (300-400 words). Must: open with a specific compelling hook (not 'I am writing to apply for'), weave in 3-5 keywords from the JD naturally, include one specific achievement with a number, close with a clear CTA. Match the tone to the company culture evident in the JD.",
  "quickFixes": ["3 concrete, immediate changes — each should be actionable in 5 minutes, e.g. 'Replace your opening line with: [specific better opening]'"]
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
