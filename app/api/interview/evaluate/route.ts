import { NextResponse } from 'next/server'
import { callAI } from '@/lib/ai-fallback'

export async function POST(req: Request) {
  try {
    const { question, answer, topic, level } = await req.json()

    if (!question || !answer) {
      return NextResponse.json({ error: 'question and answer are required.' }, { status: 400 })
    }

    const raw = (await callAI({
      messages: [
          {
            role: 'system',
            content:
              'You are an expert AI/ML technical interviewer. Evaluate the candidate answer strictly and fairly. Return ONLY valid JSON. No markdown fences.',
          },
          {
            role: 'user',
            content: `Evaluate this interview answer.

Topic: ${topic || 'AI/ML'}
Level: ${level || 'Mid'}
Question: ${question}
Candidate Answer: ${answer}

Return this exact JSON:
{
  "score": number between 1 and 10,
  "grade": "A" | "B" | "C" | "D" | "F",
  "verdict": "Excellent" | "Good" | "Average" | "Below Average" | "Poor",
  "correct": ["what the candidate got right - max 4 points"],
  "missing": ["important concepts that were missing - max 4 points"],
  "modelAnswer": "the ideal comprehensive answer in 3-5 sentences",
  "tip": "one specific actionable tip to improve this answer next time",
  "confidence": "High" | "Medium" | "Low"
}`,
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
