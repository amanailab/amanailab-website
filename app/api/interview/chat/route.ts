import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(req: Request) {
  try {
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

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map((m: Message) => ({ role: m.role, content: m.content })),
        ],
        temperature: 0.6,
        max_tokens: 600,
      }),
    })

    if (!groqRes.ok) {
      return NextResponse.json({ error: 'Failed to get response.' }, { status: 500 })
    }

    const groqData = await groqRes.json()
    const content: string = groqData.choices?.[0]?.message?.content?.trim() ?? ''

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
