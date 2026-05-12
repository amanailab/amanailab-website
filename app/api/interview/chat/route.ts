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

    const isLastTurn = turnCount >= 4

    const systemPrompt = `You are an expert AI/ML interviewer conducting a realistic mock interview about ${topic} at ${level} level.

Rules:
- Ask ONE focused technical question at a time
- After the candidate answers, give brief feedback (1-2 sentences) on their answer
- Then ask a follow-up or new question to probe deeper
- Be professional but encouraging
- If this is the ${isLastTurn ? 'last' : ''} turn, wrap up with a final score out of 10, 2-3 strengths, 2-3 areas to improve
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

    let finalFeedback = null
    let replyText = content

    if (content.includes('---FINAL_FEEDBACK---')) {
      const parts = content.split('---FINAL_FEEDBACK---')
      replyText = parts[0].trim()
      try {
        finalFeedback = JSON.parse(parts[1].trim())
      } catch {
        // ignore parse error
      }
    }

    return NextResponse.json({ reply: replyText, finalFeedback, isLastTurn })
  } catch (err) {
    console.error('[Interview Chat]', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
