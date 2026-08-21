import { NextResponse } from 'next/server'
import { callAI } from '@/lib/ai-fallback'

export const runtime = 'nodejs'
export const maxDuration = 60

function extractJSON(raw: string): string {
  // Strip <think>...</think> blocks emitted by reasoning/thinking models (e.g. Qwen3)
  let s = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()

  // Strip ```json...``` or ```...``` markdown fences
  const fenced = s.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
  if (fenced) {
    const inner = fenced[1].trim()
    if (inner.startsWith('{')) return inner
  }

  // Find the outermost {...} span (skips prose before/after the JSON object)
  const start = s.indexOf('{')
  const end = s.lastIndexOf('}')
  if (start !== -1 && end > start) return s.slice(start, end + 1)
  return s
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
          content: `You are a staff engineer at a top AI company who has run 300+ ML system design interviews. Be specific and honest — cite the candidate's actual words, not generic advice. Return ONLY valid JSON, no markdown fences.`,
        },
        {
          role: 'user',
          content: `Evaluate this ML system design interview answer.

PROBLEM: ${trimmedProblem}

CANDIDATE ANSWER:
${design}
${codeSection}

Score each section 1-10 (null if not addressed at all):
- requirements: functional+non-functional reqs, SLAs, scope clarity
- architecture: component selection, data flow, service boundaries, justification
- scalability: bottleneck analysis, caching, sharding, fault tolerance
- dataModel: schema, storage choice justification, indexes, query patterns
- tradeoffs: alternatives considered, deliberate choices explained with reasoning

Strengths and gaps MUST reference specific content from the answer. Gaps must say exactly what is missing.

Return JSON only:
{"overallScore":<1-10>,"grade":"<A|B|C|D>","summary":"<2-3 sentences: overall quality, key strength, critical gap>","strengths":["<specific citing answer>","<specific citing answer>"],"gaps":["<specific missing detail + what to add>","<specific missing detail + what to add>"],"sectionScores":{"requirements":<1-10|null>,"architecture":<1-10|null>,"scalability":<1-10|null>,"dataModel":<1-10|null>,"tradeoffs":<1-10|null>},"codeQuality":${hasCode ? '{"score":<1-10>,"notes":"<correctness, completeness, style>"}' : 'null'},"topSuggestion":"<single highest-impact specific improvement>","interviewerNote":"<what a real interviewer would think — honest, 1-2 sentences>"}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1200,
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
