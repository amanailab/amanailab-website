import { NextResponse } from 'next/server'
import { callAI } from '@/lib/ai-fallback'

export const runtime = 'nodejs'
export const maxDuration = 60

function extractJSON(raw: string): string {
  // Strip ```json...``` or ```...``` markdown fences
  const fenced = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
  if (fenced) return fenced[1].trim()
  // Find outermost {...}
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start !== -1 && end > start) return raw.slice(start, end + 1)
  return raw.trim()
}

const SECTION_KEYS = ['requirements', 'architecture', 'scalability', 'dataModel', 'tradeoffs'] as const

function clampScore(v: unknown): number | null {
  const n = Number(v)
  if (!Number.isFinite(n)) return null
  return Math.max(1, Math.min(10, Math.round(n)))
}

function toStringArray(v: unknown, max = 6): string[] {
  if (!Array.isArray(v)) return []
  return v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).slice(0, max)
}

function normalizeCodeQuality(v: unknown): { score: number; notes: string } | null {
  if (!v || typeof v !== 'object') return null
  const r = v as Record<string, unknown>
  const score = clampScore(r.score)
  const notes = typeof r.notes === 'string' ? r.notes.trim() : ''
  if (!score || !notes) return null
  return { score, notes }
}

function normalizeReview(raw: unknown) {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const grade = typeof r.grade === 'string' && ['A', 'B', 'C', 'D'].includes(r.grade.toUpperCase())
    ? r.grade.toUpperCase() : 'C'
  const sectionScores: Record<string, number | null> = {}
  const rawSections = (r.sectionScores && typeof r.sectionScores === 'object' ? r.sectionScores : {}) as Record<string, unknown>
  for (const key of SECTION_KEYS) sectionScores[key] = clampScore(rawSections[key])

  return {
    overallScore: clampScore(r.overallScore) ?? 5,
    grade,
    summary: typeof r.summary === 'string' ? r.summary : 'Review generated, but the summary was incomplete.',
    strengths: toStringArray(r.strengths),
    gaps: toStringArray(r.gaps),
    sectionScores,
    codeQuality: normalizeCodeQuality(r.codeQuality),
    topSuggestion: typeof r.topSuggestion === 'string' ? r.topSuggestion : 'Add more detail on your trade-offs and bottlenecks.',
    interviewerNote: typeof r.interviewerNote === 'string' ? r.interviewerNote : '',
  }
}

interface CodeSnippet {
  name: string
  language: string
  code: string
}

export async function POST(req: Request) {
  const { checkRateLimit, getClientIp } = await import('@/lib/rate-limit')
  const { allowed, retryAfterSec } = checkRateLimit(`${getClientIp(req)}:sd-review`, 5, 60_000)
  if (!allowed) {
    return NextResponse.json(
      { error: `Too many requests. Please wait ${retryAfterSec} seconds.` },
      { status: 429 },
    )
  }

  try {
    const body = await req.json()
    const problem = typeof body?.problem === 'string' ? body.problem : ''
    let design = typeof body?.design === 'string' ? body.design : ''
    const codeSnippets: CodeSnippet[] = Array.isArray(body?.codeSnippets)
      ? body.codeSnippets.filter(
          (s: unknown) => s && typeof s === 'object' && typeof (s as CodeSnippet).code === 'string' && (s as CodeSnippet).code.trim().length > 0,
        ).slice(0, 6)
      : []

    if (!problem || !design.trim()) {
      return NextResponse.json({ error: 'Problem and design are required.' }, { status: 400 })
    }
    if (design.trim().length < 100) {
      return NextResponse.json({ error: 'Design answer is too short. Please write more detail before requesting a review.' }, { status: 400 })
    }

    // Trim aggressively to avoid Groq 413 Payload Too Large (≈ 6K token limit)
    const MAX_PROBLEM_CHARS = 1_500
    const MAX_DESIGN_CHARS  = 5_000
    const MAX_CODE_CHARS    = 1_500
    const trimmedProblem = problem.length > MAX_PROBLEM_CHARS ? problem.slice(0, MAX_PROBLEM_CHARS) + '…' : problem
    if (design.length > MAX_DESIGN_CHARS) design = design.slice(0, MAX_DESIGN_CHARS)

    const codeSection = codeSnippets.length > 0
      ? `\nCANDIDATE CODE SNIPPETS:\n${codeSnippets.map(s => {
          const code = s.code.length > MAX_CODE_CHARS / codeSnippets.length
            ? s.code.slice(0, Math.floor(MAX_CODE_CHARS / codeSnippets.length))
            : s.code
          return `### ${s.name} (${s.language})\n\`\`\`${s.language}\n${code}\n\`\`\``
        }).join('\n\n')}`
      : ''

    const hasCode = codeSnippets.length > 0

    const raw = await callAI({
      messages: [
        {
          role: 'system',
          content: `You are a senior staff engineer at a top AI company who has conducted 300+ system design interviews. Give honest, specific, actionable feedback. Return ONLY valid JSON — no markdown, no prose outside JSON.`,
        },
        {
          role: 'user',
          content: `Review this ML system design answer.

PROBLEM: ${trimmedProblem}

ANSWER:
${design}
${codeSection}

Score on: Requirements, Architecture, Scalability, Data Model, Trade-offs${hasCode ? ', Code Quality' : ''}.

Return JSON:
{"overallScore":<1-10>,"grade":"<A|B|C|D>","summary":"<2-3 sentences>","strengths":["<specific>","<specific>"],"gaps":["<specific>","<specific>"],"sectionScores":{"requirements":<1-10 or null>,"architecture":<1-10 or null>,"scalability":<1-10 or null>,"dataModel":<1-10 or null>,"tradeoffs":<1-10 or null>},"codeQuality":${hasCode ? '{"score":<1-10>,"notes":"<2-3 sentences>"}' : 'null'},"topSuggestion":"<single best improvement>","interviewerNote":"<1-2 sentences honest feedback>"}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 900,
      response_format: { type: 'json_object' },
    })

    let parsed: unknown
    try {
      const cleaned = extractJSON(typeof raw === 'string' ? raw : JSON.stringify(raw))
      parsed = JSON.parse(cleaned)
    } catch {
      console.error('[system-design/review] JSON parse failed. Raw response:', raw?.slice?.(0, 300))
      return NextResponse.json({ error: 'Failed to parse AI review. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ review: normalizeReview(parsed) })
  } catch (err) {
    console.error('[system-design/review]', err)
    return NextResponse.json({ error: 'Review failed. Please try again in a moment.' }, { status: 500 })
  }
}
