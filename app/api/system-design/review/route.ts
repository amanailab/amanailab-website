import { NextResponse } from 'next/server'
import { callAI } from '@/lib/ai-fallback'
import { getAdminSupabase } from '@/lib/admin'

export const runtime = 'nodejs'
export const maxDuration = 60

const FREE_LIMIT = 2
const PAID_DAILY = 15

function extractJSON(raw: string): string {
  let s = raw
  s = s.replace(/<think>[\s\S]*?<\/think>/gi, '')
  const openThink = s.search(/<think>/i)
  if (openThink !== -1) s = s.slice(0, openThink)
  s = s.trim()
  const fenced = s.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
  if (fenced) {
    const inner = fenced[1].trim()
    if (inner.startsWith('{')) return inner
  }
  const start = s.indexOf('{')
  const end   = s.lastIndexOf('}')
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
    overallScore:    clampScore(r.overallScore) ?? 5,
    grade,
    summary:         typeof r.summary === 'string' ? r.summary : 'Review generated, but the summary was incomplete.',
    strengths:       toStringArray(r.strengths),
    gaps:            toStringArray(r.gaps),
    sectionScores,
    codeQuality:     normalizeCodeQuality(r.codeQuality),
    topSuggestion:   typeof r.topSuggestion === 'string' ? r.topSuggestion : 'Add more detail on your trade-offs and bottlenecks.',
    interviewerNote: typeof r.interviewerNote === 'string' ? r.interviewerNote : '',
  }
}

interface CodeSnippet { name: string; language: string; code: string }

export async function POST(req: Request) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: 'Sign in to use AI Review.', code: 'AUTH_REQUIRED' },
      { status: 401 },
    )
  }

  // ── Subscription + usage check ────────────────────────────────────────────
  const admin = getAdminSupabase()

  const { data: sub } = await admin
    .from('sd_subscriptions')
    .select('subscribed_until')
    .eq('user_id', user.id)
    .maybeSingle()

  const isSubscribed = !!sub && new Date(sub.subscribed_until) > new Date()

  if (isSubscribed) {
    // Use IST (UTC+5:30) for daily window — Indian users get midnight IST reset
    const IST_MS    = 5.5 * 60 * 60 * 1000
    const nowIst    = new Date(Date.now() + IST_MS)
    const istStart  = new Date(
      Date.UTC(nowIst.getUTCFullYear(), nowIst.getUTCMonth(), nowIst.getUTCDate()) - IST_MS,
    )

    const { count } = await admin
      .from('sd_review_usage')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('used_at', istStart.toISOString())

    if ((count ?? 0) >= PAID_DAILY) {
      return NextResponse.json(
        { error: `You've used all ${PAID_DAILY} AI reviews for today. Resets at midnight IST.`, code: 'DAILY_LIMIT' },
        { status: 429 },
      )
    }
  } else {
    const { count } = await admin
      .from('sd_review_usage')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if ((count ?? 0) >= FREE_LIMIT) {
      return NextResponse.json(
        { error: 'Free review limit reached. Upgrade to Pro for 15 reviews/day.', code: 'PAYWALL' },
        { status: 402 },
      )
    }
  }

  // ── Parse body ─────────────────────────────────────────────────────────────
  try {
    const body        = await req.json()
    const slug        = typeof body?.slug    === 'string' ? body.slug    : ''
    const problem     = typeof body?.problem === 'string' ? body.problem : ''
    let   design      = typeof body?.design  === 'string' ? body.design  : ''
    const codeSnippets: CodeSnippet[] = Array.isArray(body?.codeSnippets)
      ? body.codeSnippets.filter(
          (s: unknown) => s && typeof s === 'object' && typeof (s as CodeSnippet).code === 'string' && (s as CodeSnippet).code.trim().length > 0,
        ).slice(0, 6)
      : []

    if (!problem || !design.trim()) {
      return NextResponse.json({ error: 'Problem and design are required.' }, { status: 400 })
    }
    if (design.trim().length < 100) {
      return NextResponse.json({ error: 'Design answer is too short. Write more before requesting a review.' }, { status: 400 })
    }

    const MAX_PROBLEM_CHARS = 1_500
    const MAX_DESIGN_CHARS  = 8_000
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
      max_tokens:  1200,
    })

    let parsed: unknown
    try {
      const cleaned = extractJSON(typeof raw === 'string' ? raw : JSON.stringify(raw))
      parsed = JSON.parse(cleaned)
    } catch {
      console.error('[system-design/review] JSON parse failed. Raw:', raw?.slice?.(0, 300))
      return NextResponse.json({ error: 'Failed to parse AI review. Please try again.' }, { status: 500 })
    }

    // ── Log usage ────────────────────────────────────────────────────────────
    void admin.from('sd_review_usage').insert({
      user_id:      user.id,
      problem_slug: slug,
      used_at:      new Date().toISOString(),
    })

    return NextResponse.json({ review: normalizeReview(parsed) })
  } catch (err) {
    console.error('[system-design/review]', err)
    return NextResponse.json({ error: 'Review failed. Please try again in a moment.' }, { status: 500 })
  }
}
