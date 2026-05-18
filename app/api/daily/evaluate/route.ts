import { NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/admin'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { callAI } from '@/lib/ai-fallback'

export const runtime = 'nodejs'
export const maxDuration = 60

function todayIndex(): number {
  return Math.floor(Date.now() / 86400000)
}

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const rl = checkRateLimit(`daily-eval:${ip}`, 5, 60_000)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many requests. Please wait before evaluating again.' }, { status: 429 })
  }

  try {
    const { questionId, userAnswer } = await req.json()

    if (!questionId || !userAnswer?.trim()) {
      return NextResponse.json({ error: 'Question ID and answer are required' }, { status: 400 })
    }
    const safeAnswer = String(userAnswer).slice(0, 3000)

    const supabase = getAdminSupabase()

    const { data: questions } = await supabase
      .from('interview_questions')
      .select('id, question, answer, topic, level')
      .order('id', { ascending: true })

    if (!questions || questions.length === 0) {
      return NextResponse.json({ error: 'Questions not found' }, { status: 404 })
    }

    const idx = todayIndex() % questions.length
    const today = questions[idx]

    if (String(today.id) !== String(questionId)) {
      return NextResponse.json({ error: "Not today's question" }, { status: 400 })
    }

    const raw = (await callAI({
      messages: [
          {
            role: 'system',
            content: `You are an expert AI/ML interviewer evaluating a candidate's written answer.
Score strictly. Return ONLY valid JSON, no markdown fences.`,
          },
          {
            role: 'user',
            content: `Question: ${today.question}

Candidate's Answer: ${safeAnswer}

Reference Answer (for your use only — do not quote verbatim): ${today.answer}

Return this exact JSON:
{
  "score": <integer 1-10>,
  "verdict": "<one of: Excellent | Good | Needs Work | Incomplete>",
  "feedback": "<2-3 sentences of specific, constructive feedback>",
  "key_points_covered": ["<point 1>", "<point 2>"],
  "key_points_missed": ["<point 1>", "<point 2>"],
  "model_answer_highlight": "<the 2-3 most important sentences from the ideal answer, in your own words>"
}`,
          },
        ],
      temperature: 0.3,
      max_tokens: 600,
      response_format: { type: 'json_object' },
    })).trim() || '{}'

    let ev: {
      score?: number
      verdict?: string
      feedback?: string
      key_points_covered?: string[]
      key_points_missed?: string[]
      model_answer_highlight?: string
    }
    try {
      ev = JSON.parse(raw)
    } catch {
      ev = { score: 5, verdict: 'Good', feedback: raw }
    }

    return NextResponse.json({
      score: ev.score ?? 5,
      verdict: ev.verdict ?? 'Good',
      feedback: ev.feedback ?? '',
      key_points_covered: ev.key_points_covered ?? [],
      key_points_missed: ev.key_points_missed ?? [],
      model_answer_highlight: ev.model_answer_highlight ?? '',
    })
  } catch (err) {
    console.error('[Daily Evaluate]', err)
    return NextResponse.json({ error: 'Evaluation failed' }, { status: 500 })
  }
}
