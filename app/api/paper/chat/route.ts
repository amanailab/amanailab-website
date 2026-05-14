import { NextResponse } from 'next/server'
import { callAI } from '@/lib/ai-fallback'

export const runtime = 'nodejs'
export const maxDuration = 30

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(req: Request) {
  const { checkRateLimit, getClientIp } = await import('@/lib/rate-limit')
  const { allowed, retryAfterSec } = checkRateLimit(`${getClientIp(req)}:paper-chat`, 15, 60_000)
  if (!allowed) {
    return NextResponse.json(
      { error: `Too many requests. Wait ${retryAfterSec}s.` },
      { status: 429, headers: { 'Retry-After': String(retryAfterSec) } }
    )
  }

  try {
    const body = await req.json()

    const question: string = typeof body.question === 'string' ? body.question.trim() : ''
    const paperContext: string = typeof body.paperContext === 'string' ? body.paperContext.trim() : ''
    const rawHistory: unknown[] = Array.isArray(body.history) ? body.history : []

    if (!question) {
      return NextResponse.json({ error: 'A question is required.' }, { status: 400 })
    }
    if (!paperContext) {
      return NextResponse.json({ error: 'Paper context is required.' }, { status: 400 })
    }

    // Cap inputs to stay well within the 50,000-char total limit across all messages
    const cappedQuestion = question.slice(0, 1_000)
    const cappedContext = paperContext.slice(0, 3_000)

    // Sanitise and cap history to the last 8 items
    const history: ChatMessage[] = rawHistory
      .filter(
        (item): item is ChatMessage =>
          typeof item === 'object' &&
          item !== null &&
          'role' in item &&
          'content' in item &&
          ((item as ChatMessage).role === 'user' || (item as ChatMessage).role === 'assistant') &&
          typeof (item as ChatMessage).content === 'string'
      )
      .slice(-8)
      .map((item) => ({
        role: item.role,
        content: item.content.slice(0, 2_000), // guard individual history entries too
      }))

    const answer = await callAI({
      messages: [
        {
          role: 'system',
          content:
            'You are an expert AI/ML research assistant. You have read and deeply analyzed the following research paper. Answer questions precisely, technically accurately, and helpfully. If asked about implementation, provide Python examples. Be concise but complete — 2-4 sentences unless more detail is needed.',
        },
        {
          role: 'user',
          content: `Paper context:\n${cappedContext}`,
        },
        ...history,
        {
          role: 'user',
          content: cappedQuestion,
        },
      ],
      temperature: 0.4,
      max_tokens: 1_024,
    })

    return NextResponse.json({ answer: answer.trim() })
  } catch (err) {
    console.error('[paper/chat]', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
