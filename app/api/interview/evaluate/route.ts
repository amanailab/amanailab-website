import { NextResponse } from 'next/server'
import { callAI } from '@/lib/ai-fallback'
import { enforceRateLimit } from '@/lib/rate-limit'

export async function POST(req: Request) {
  const limited = enforceRateLimit(req, 'interview-evaluate', 15, 60_000)
  if (limited) return limited
  try {
    const { question, answer, topic, level } = await req.json()

    if (!question || !answer) {
      return NextResponse.json({ error: 'question and answer are required.' }, { status: 400 })
    }

    const raw = (await callAI({
      messages: [
          {
            role: 'system',
            content: `You are a senior AI/ML interviewer at a top AI company (Google Brain, OpenAI, Meta AI, Anthropic). You evaluate interview answers with the calibration of a real panel interview — you know exactly what ${level || 'mid-level'} engineers are expected to know. You give honest, specific, constructive feedback that actually helps candidates improve. Return ONLY valid JSON. No markdown.`,
          },
          {
            role: 'user',
            content: `Evaluate this interview answer.

Topic: ${topic || 'AI/ML'}
Level: ${level || 'Mid'}
Question: ${question}
Candidate's Answer: ${answer}

Return this exact JSON:
{
  "score": integer 1-10 (7+ = would pass at this level, 5-6 = borderline, <5 = would not pass),
  "grade": "A" | "B" | "C" | "D" | "F",
  "verdict": "Excellent" | "Good" | "Average" | "Below Average" | "Poor",
  "correct": ["specific thing they got right — be precise, e.g. 'correctly identified attention complexity as O(n²)'"],
  "missing": ["specific important concept missing — e.g. 'didn't mention causal masking in decoder-only models'"],
  "modelAnswer": "the ideal answer a strong ${level || 'mid-level'} candidate would give — 4-6 sentences, technically precise, includes key concepts, maybe a formula or concrete example",
  "tip": "one highly specific, actionable improvement — not generic advice like 'study more', but 'next time, lead with the formula/equation/architecture name, then explain intuition'",
  "confidence": "High" | "Medium" | "Low"
}

Calibration guidance:
- Score 9-10: Complete, precise, would hire without hesitation
- Score 7-8: Covers main points, minor gaps, strong pass
- Score 5-6: Core idea right but missing important depth, borderline
- Score 3-4: Partial understanding, significant gaps
- Score 1-2: Fundamentally wrong or too vague to evaluate`,
          },
        ],
      temperature: 0.3,
      max_tokens: 1024,
      response_format: { type: 'json_object' },
    })).trim()

    let evaluation
    try {
      const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
      evaluation = JSON.parse(cleaned)
    } catch {
      console.error('[Evaluate] JSON parse error, raw:', raw)
      return NextResponse.json({ error: 'Failed to parse evaluation.' }, { status: 502 })
    }

    return NextResponse.json(evaluation)
  } catch (err) {
    console.error('[Evaluate] Error:', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
