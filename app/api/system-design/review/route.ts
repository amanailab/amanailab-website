import { NextResponse } from 'next/server'
import { callAI } from '@/lib/ai-fallback'

export const runtime = 'nodejs'
export const maxDuration = 60

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

    const MAX_DESIGN_CHARS = 14_000
    const MAX_CODE_CHARS   = 4_000
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
          content: `You are a senior staff engineer at a top-tier AI company (Google DeepMind / Meta AI / OpenAI) who has conducted 300+ ML system design interviews. You give structured, honest, educational feedback. You are encouraging but precise — specific over vague, actionable over generic. Never give empty praise. Return ONLY valid JSON with no markdown wrapping.`,
        },
        {
          role: 'user',
          content: `Review this system design answer for the following ML system design interview question.

PROBLEM:
${problem}

CANDIDATE'S WRITTEN ANSWER:
${design}
${codeSection}

Evaluate across these dimensions:
- Requirements Clarification: Did they identify functional + non-functional requirements, scale, SLAs?
- Architecture: Are the components correct, well-chosen, and clearly described?
- Scalability: Bottleneck identification, horizontal scaling, caching, sharding?
- Data Model: Schema design, storage choice justification, query patterns?
- Trade-offs: Did they reason about alternatives, pros/cons, and make deliberate choices?
${hasCode ? '- Code Quality: Is the code correct, complete, idiomatic, and interview-ready? Does it match the design?' : ''}

Return JSON in exactly this format:
{
  "overallScore": <integer 1-10>,
  "grade": "<A|B|C|D>",
  "summary": "<2-3 sentences: overall quality, biggest strength, and most critical gap>",
  "strengths": ["<specific, concrete strength citing their actual answer>", "<another>"],
  "gaps": ["<specific gap with what an interviewer expects to see>", "<another>"],
  "sectionScores": {
    "requirements": <1-10 or null if not addressed>,
    "architecture": <1-10 or null>,
    "scalability": <1-10 or null>,
    "dataModel": <1-10 or null>,
    "tradeoffs": <1-10 or null>
  },
  "codeQuality": ${hasCode ? '{ "score": <1-10>, "notes": "<2-3 sentences on correctness, completeness, style, and whether it matches the stated design>" }' : 'null'},
  "topSuggestion": "<the single highest-impact improvement — be specific, not generic>",
  "interviewerNote": "<what a real interviewer would say after this answer — 1-2 sentences, honest and specific>"
}`,
        },
      ],
      temperature: 0.35,
      max_tokens: 1100,
      response_format: { type: 'json_object' },
    })

    let parsed: unknown
    try {
      parsed = JSON.parse(typeof raw === 'string' ? raw : JSON.stringify(raw))
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI review. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ review: normalizeReview(parsed) })
  } catch (err) {
    console.error('[system-design/review]', err)
    return NextResponse.json({ error: 'Review failed. Please try again in a moment.' }, { status: 500 })
  }
}
