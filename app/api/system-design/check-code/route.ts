import { NextResponse } from 'next/server'
import { callAI } from '@/lib/ai-fallback'

export const runtime   = 'nodejs'
export const maxDuration = 30

function extractJSON(raw: string): string {
  let s = raw
  s = s.replace(/<think>[\s\S]*?<\/think>/gi, '')
  const openThink = s.search(/<think>/i)
  if (openThink !== -1) s = s.slice(0, openThink)
  s = s.trim()
  const fenced = s.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
  if (fenced) { const inner = fenced[1].trim(); if (inner.startsWith('{')) return inner }
  const start = s.indexOf('{'); const end = s.lastIndexOf('}')
  if (start !== -1 && end > start) return s.slice(start, end + 1)
  return s
}

export async function POST(req: Request) {
  try {
    const body     = await req.json()
    const problem  = typeof body?.problem  === 'string' ? body.problem.slice(0, 500)  : ''
    const language = typeof body?.language === 'string' ? body.language : 'python'
    const code     = typeof body?.code     === 'string' ? body.code.slice(0, 4000)    : ''

    if (!code.trim() || code.trim().length < 20) {
      return NextResponse.json({ error: 'Write some code first — at least a few lines.' }, { status: 400 })
    }

    const raw = await callAI({
      messages: [
        {
          role: 'system',
          content: 'You are a senior SWE at Google reviewing a system design code submission. Be specific and direct. Return ONLY valid JSON, no markdown fences.',
        },
        {
          role: 'user',
          content: `Review this ${language} code written for the system design problem: "${problem || 'system design interview'}"

\`\`\`${language}
${code}
\`\`\`

Check:
1. Correctness — does it work correctly? Any bugs?
2. Edge cases — what inputs or scenarios would break it?
3. Time complexity + space complexity
4. Code quality — naming, structure, missing pieces

Return JSON only:
{"correct":true,"grade":"A","complexity":{"time":"O(1)","space":"O(n)"},"issues":["specific bug"],"suggestions":["specific fix"],"summary":"2 sentences covering what works and the most critical issue"}`,
        },
      ],
      temperature: 0.2,
      max_tokens:  700,
    })

    let parsed: unknown
    try {
      parsed = JSON.parse(extractJSON(typeof raw === 'string' ? raw : JSON.stringify(raw)))
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response. Try again.' }, { status: 500 })
    }

    const r = (parsed && typeof parsed === 'object' ? parsed : {}) as Record<string, unknown>
    const grade = typeof r.grade === 'string' && ['A', 'B', 'C', 'D'].includes(r.grade.toUpperCase())
      ? r.grade.toUpperCase() : 'C'
    const complexity = r.complexity && typeof r.complexity === 'object'
      ? r.complexity as { time: string; space: string }
      : { time: 'Unknown', space: 'Unknown' }

    return NextResponse.json({
      correct:     typeof r.correct === 'boolean' ? r.correct : false,
      grade,
      complexity,
      issues:      Array.isArray(r.issues)      ? (r.issues      as string[]).filter(x => typeof x === 'string').slice(0, 5) : [],
      suggestions: Array.isArray(r.suggestions) ? (r.suggestions as string[]).filter(x => typeof x === 'string').slice(0, 5) : [],
      summary:     typeof r.summary === 'string' ? r.summary : '',
    })
  } catch (err) {
    console.error('[check-code]', err)
    return NextResponse.json({ error: 'Code check failed. Please try again.' }, { status: 500 })
  }
}
