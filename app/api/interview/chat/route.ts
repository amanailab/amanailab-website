import { NextResponse } from 'next/server'
import { callAI } from '@/lib/ai-fallback'

export const runtime = 'nodejs'
export const maxDuration = 60

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(req: Request) {
  try {
  const { checkRateLimit, getClientIp } = await import('@/lib/rate-limit')
  const { allowed, retryAfterSec } = checkRateLimit(`${getClientIp(req)}:interview`, 15, 60_000)
  if (!allowed) {
    return NextResponse.json(
      { error: `Too many requests. Please wait ${retryAfterSec} seconds.` },
      { status: 429, headers: { 'Retry-After': String(retryAfterSec) } }
    )
  }


    const { messages, topic, level, turnCount } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required.' }, { status: 400 })
    }
    if (messages.length > 20) {
      return NextResponse.json({ error: 'Too many messages in history.' }, { status: 400 })
    }
    if (!topic || typeof topic !== 'string' || topic.length > 100) {
      return NextResponse.json({ error: 'Valid topic is required.' }, { status: 400 })
    }
    if (!level || typeof level !== 'string' || level.length > 50) {
      return NextResponse.json({ error: 'Valid level is required.' }, { status: 400 })
    }

    const MAX_TURNS = 5
    const isLastTurn = turnCount >= MAX_TURNS

    const systemPrompt = `You are an expert AI/ML interviewer conducting a realistic mock interview about ${topic} at ${level} level.

Rules:
- Ask ONE focused technical question at a time
- After the candidate answers, give brief feedback (1-2 sentences) on their answer
- Then ask a follow-up or new question to probe deeper
- Be professional but encouraging
${isLastTurn ? '- This is the LAST turn. Wrap up with a final score out of 10, 2-3 strengths, 2-3 areas to improve' : ''}
${isLastTurn ? '- END your response with: ---FINAL_FEEDBACK---\n{"score": number, "strengths": [], "improvements": []}' : ''}

Do NOT generate JSON unless it is the final turn wrap-up.`

    const content = (await callAI({
      messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map((m: Message) => ({ role: m.role, content: m.content })),
        ],
      temperature: 0.6,
      max_tokens: 600,
    })).trim()

    let finalFeedback: { score: number; strengths: string[]; improvements: string[] } | null = null
    let replyText = content
    let feedbackParseError = false

    if (content.includes('---FINAL_FEEDBACK---')) {
      const parts = content.split('---FINAL_FEEDBACK---')
      replyText = parts[0].trim()
      const rawTail = parts[1] ?? ''
      try {
        // Strip code fences AND extract the first {...} block — handles models that
        // wrap JSON in extra prose despite instructions.
        const stripped = rawTail.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
        const jsonMatch = stripped.match(/\{[\s\S]*\}/)
        const raw = jsonMatch ? jsonMatch[0] : stripped
        const parsed = JSON.parse(raw)
        finalFeedback = {
          score: Math.max(0, Math.min(10, Number(parsed.score) || 0)),
          strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 5).map(String) : [],
          improvements: Array.isArray(parsed.improvements) ? parsed.improvements.slice(0, 5).map(String) : [],
        }
      } catch {
        // Build a graceful fallback so the user still sees a result instead of an error
        const scoreMatch = rawTail.match(/(\d+(?:\.\d+)?)\s*\/\s*10/) ?? rawTail.match(/score["\s:]+(\d+(?:\.\d+)?)/i)
        const fallbackScore = scoreMatch ? Math.max(0, Math.min(10, Number(scoreMatch[1]))) : 6
        finalFeedback = {
          score: fallbackScore,
          strengths: ['Completed the full interview'],
          improvements: ['Detailed feedback unavailable — try another session for more specific guidance'],
        }
        feedbackParseError = true
      }
    }

    return NextResponse.json({ reply: replyText, finalFeedback, isLastTurn, feedbackParseError })
  } catch (err) {
    console.error('[Interview Chat]', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
