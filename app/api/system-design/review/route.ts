import { NextResponse } from 'next/server'
import { callAI } from '@/lib/ai-fallback'
import { getAdminSupabase } from '@/lib/admin'
import { isSdAdmin } from '@/lib/sd-admins'

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
  // Strip any markdown code fences (```json ... ``` or ``` ... ```)
  const fenced = s.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
  if (fenced) {
    const inner = fenced[1].trim()
    if (inner.startsWith('{')) return inner
  }
  // Find outermost { }
  const start = s.indexOf('{')
  const end   = s.lastIndexOf('}')
  if (start !== -1 && end > start) return s.slice(start, end + 1)
  return s
}

function repairJSON(s: string): string {
  // Remove trailing commas before } or ]
  s = s.replace(/,(\s*[}\]])/g, '$1')
  // Remove JS-style // comments
  s = s.replace(/\/\/[^\n]*/g, '')
  // Remove JS-style /* */ comments
  s = s.replace(/\/\*[\s\S]*?\*\//g, '')
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

interface FollowUp { question: string; whatStrongAnswersCover: string }
function normalizeFollowUps(v: unknown, max = 3): FollowUp[] {
  if (!Array.isArray(v)) return []
  return v
    .map((x): FollowUp | null => {
      if (!x || typeof x !== 'object') return null
      const r = x as Record<string, unknown>
      const question = typeof r.question === 'string' ? r.question.trim() : ''
      const cover    = typeof r.whatStrongAnswersCover === 'string' ? r.whatStrongAnswersCover.trim() : ''
      if (!question) return null
      return { question, whatStrongAnswersCover: cover }
    })
    .filter((x): x is FollowUp => !!x)
    .slice(0, max)
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
    followUps:       normalizeFollowUps(r.followUps),
  }
}

interface CodeSnippet { name: string; language: string; code: string }
interface RequestBody {
  slug?: unknown; problem?: unknown; category?: unknown; keyAreas?: unknown
  design?: unknown; diagram?: unknown; codeSnippets?: unknown
}

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

  // Per-user guard: blocks parallel clicks from slipping past the daily-count check
  const { checkRateLimit } = await import('@/lib/rate-limit')
  const rl = checkRateLimit(`sd-review-user:${user.id}`, 2, 15_000)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'A review is already running — give it a few seconds.' }, { status: 429 })
  }

  // ── Subscription + usage check ────────────────────────────────────────────
  const admin = getAdminSupabase()

  const { data: sub } = await admin
    .from('sd_subscriptions')
    .select('subscribed_until')
    .eq('user_id', user.id)
    .maybeSingle()

  const isSubscribed = !!sub && new Date(sub.subscribed_until) > new Date()
  const isAdmin      = isSdAdmin(user.email)

  if (isAdmin) {
    // Owner/admin accounts skip all usage limits.
  } else if (isSubscribed) {
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
    const body        = await req.json() as RequestBody
    const slug        = typeof body?.slug     === 'string' ? body.slug     : ''
    const problem     = typeof body?.problem  === 'string' ? body.problem  : ''
    const category    = typeof body?.category === 'string' ? body.category : ''
    const keyAreas    = Array.isArray(body?.keyAreas)
      ? (body.keyAreas as unknown[]).filter((x): x is string => typeof x === 'string').slice(0, 12)
      : []
    let   design      = typeof body?.design  === 'string' ? body.design  : ''
    let   diagram     = typeof body?.diagram === 'string' ? body.diagram : ''
    const codeSnippets: CodeSnippet[] = Array.isArray(body?.codeSnippets)
      ? body.codeSnippets.filter(
          (s: unknown) => s && typeof s === 'object' && typeof (s as CodeSnippet).code === 'string' && (s as CodeSnippet).code.trim().length > 0,
        ).slice(0, 6)
      : []

    if (!problem) {
      return NextResponse.json({ error: 'Problem is required.' }, { status: 400 })
    }
    const hasEnoughContent = design.trim().length >= 100 || diagram.trim().length > 0 || codeSnippets.length > 0
    if (!hasEnoughContent) {
      return NextResponse.json({ error: 'Not enough content to review. Write more, draw a diagram, or add code first.' }, { status: 400 })
    }

    const MAX_PROBLEM_CHARS = 1_500
    const MAX_DESIGN_CHARS  = 8_000
    const MAX_DIAGRAM_CHARS = 2_000
    const MAX_CODE_CHARS    = 1_500
    const trimmedProblem = problem.length > MAX_PROBLEM_CHARS ? problem.slice(0, MAX_PROBLEM_CHARS) + '…' : problem
    if (design.length  > MAX_DESIGN_CHARS)  design  = design.slice(0, MAX_DESIGN_CHARS)
    if (diagram.length > MAX_DIAGRAM_CHARS) diagram = diagram.slice(0, MAX_DIAGRAM_CHARS)

    const diagramSection = diagram.trim()
      ? `\n=== (B) ARCHITECTURE DIAGRAM (drawn on the visual canvas) ===\n${diagram.trim()}`
      : ''

    const codeSection = codeSnippets.length > 0
      ? `\nCANDIDATE CODE SNIPPETS:\n${codeSnippets.map(s => {
          const code = s.code.length > MAX_CODE_CHARS / codeSnippets.length
            ? s.code.slice(0, Math.floor(MAX_CODE_CHARS / codeSnippets.length))
            : s.code
          return `### ${s.name} (${s.language})\n\`\`\`${s.language}\n${code}\n\`\`\``
        }).join('\n\n')}`
      : ''

    const hasCode = codeSnippets.length > 0

    const keyAreasSection = keyAreas.length > 0
      ? `\nMUST-COVER KEY AREAS FOR THIS PROBLEM (check if candidate addressed each):\n${keyAreas.map((a, i) => `${i + 1}. ${a}`).join('\n')}`
      : ''

    const categoryCtx = category ? ` (${category})` : ''

    const raw = await callAI({
      messages: [
        {
          role: 'system',
          content: `You are a staff ML engineer at a top AI company who has conducted 300+ system design interviews. Your reviews are specific to the question asked — you cite the candidate's actual words, note exactly which key areas were missed, and give actionable next steps. Return ONLY valid JSON, no markdown fences.`,
        },
        {
          role: 'user',
          content: `Evaluate this ${categoryCtx} system design interview answer.

INTERVIEW QUESTION:
${trimmedProblem}
${keyAreasSection}

The candidate answers in TWO places, and you MUST review BOTH:
 (A) WRITTEN ANSWER — typed in the text editor (requirements, capacity, data model, APIs, scalability, trade-offs, monitoring).
 (B) ARCHITECTURE DIAGRAM — drawn on the visual canvas (components + how they connect). This is where architecture lives, NOT the written text.

=== (A) WRITTEN ANSWER (from the text editor) ===
${design || '(the candidate wrote nothing in the editor)'}
${diagramSection || '\n=== (B) ARCHITECTURE DIAGRAM ===\n(the candidate drew nothing on the canvas)'}
${codeSection}

EVALUATION INSTRUCTIONS:
1. Score each section 1-10 (null if completely unaddressed):
   - requirements: (from WRITTEN) functional+non-functional reqs, scale numbers, SLAs, scope — did they define what they're building?
   - architecture: (from the DIAGRAM in section B, NOT the written text) Read the diagram as a real system topology: follow the data flow from clients through each component to storage. Judge component selection, data-flow direction, service boundaries and connections. Do NOT penalize the written answer for lacking an architecture section — architecture is the diagram. IMPORTANT: two components of the same type (e.g. "Cache #1" and "Cache #2", or two Services) are SEPARATE instances placed on purpose — never call them duplicates or redundant unless they truly serve the identical role with no distinguishing wiring; instead infer each one's likely role from what it connects to. ${diagram.trim() ? 'Check: are the right components present for THIS problem, are connections sensible and directional, are key pieces missing (load balancer, cache, queue, DB, CDN, etc.), are any components left unconnected?' : 'No diagram was drawn — set architecture to null and tell them in gaps to draw their architecture on the canvas.'}
   - scalability: (from WRITTEN) bottlenecks identified, caching strategy, sharding, fault tolerance, 10x growth plan
   - dataModel: (from WRITTEN) schema design, SQL vs NoSQL justification, indexes, query patterns, partition strategy
   - tradeoffs: (from WRITTEN) alternatives considered and rejected, explicit reasoning, CAP theorem awareness

2. For EACH key area listed above, note whether the candidate addressed it (even briefly) in EITHER the writing or the diagram.
${diagram.trim() && design.trim() ? '\n2b. CROSS-CHECK the writing against the diagram: do the components they drew actually support what they wrote (e.g. they mention caching in text — is there a cache in the diagram)? Call out any mismatch, and any component in the diagram they never explain in the text, in gaps.\n' : ''}
3. Strengths MUST be specific — quote/paraphrase the written text AND cite concrete parts of the diagram (name the components/connections that are good).
4. Gaps MUST name exactly what's missing and what a strong answer would include — cover BOTH weak writing AND missing/incorrect architecture components or connections.
5. The interviewerNote should reflect what a FAANG interviewer would actually think about the answer as a whole (writing + diagram).
6. followUps: 3 pointed questions THIS interviewer would ask next to probe weak spots in the candidate's specific answer (e.g. "how does this handle a 10x traffic spike?", "what happens when the cache node fails?"). For each, whatStrongAnswersCover briefly names what a strong response should mention. Make them specific to what the candidate wrote/drew, not generic.

Return JSON only (no markdown fences):
{"overallScore":<1-10>,"grade":"<A|B|C|D>","summary":"<2-3 sentences: overall quality + key strength + most critical gap>","strengths":["<quote/paraphrase from answer + why it's good>","<quote/paraphrase + why>"],"gaps":["<exactly what's missing + what to add>","<exactly what's missing + what to add>"],"sectionScores":{"requirements":<1-10|null>,"architecture":<1-10|null>,"scalability":<1-10|null>,"dataModel":<1-10|null>,"tradeoffs":<1-10|null>},"codeQuality":${hasCode ? '{"score":<1-10>,"notes":"<correctness, completeness, relevance to the problem>"}' : 'null'},"topSuggestion":"<single most impactful specific change the candidate should make>","interviewerNote":"<honest 1-2 sentence reaction from a real interviewer at this level>","followUps":[{"question":"<pointed follow-up question>","whatStrongAnswersCover":"<what a strong answer covers>"},{"question":"<...>","whatStrongAnswersCover":"<...>"},{"question":"<...>","whatStrongAnswersCover":"<...>"}]}`,
        },
      ],
      temperature: 0.25,
      max_tokens:  2600,
    })

    let parsed: unknown
    try {
      const cleaned = extractJSON(typeof raw === 'string' ? raw : JSON.stringify(raw))
      try {
        parsed = JSON.parse(cleaned)
      } catch {
        // Second attempt: repair common JSON issues (trailing commas, comments)
        parsed = JSON.parse(repairJSON(cleaned))
      }
    } catch {
      console.error('[system-design/review] JSON parse failed. Raw:', raw?.slice?.(0, 500))
      return NextResponse.json({ error: 'Failed to parse AI review. Please try again.' }, { status: 500 })
    }

    // ── Log usage ────────────────────────────────────────────────────────────
    const { error: usageErr } = await admin.from('sd_review_usage').insert({
      user_id:      user.id,
      problem_slug: slug,
      used_at:      new Date().toISOString(),
    })
    if (usageErr) console.error('[sd-review] usage insert failed:', usageErr)

    return NextResponse.json({ review: normalizeReview(parsed) })
  } catch (err) {
    console.error('[system-design/review]', err)
    return NextResponse.json({ error: 'Review failed. Please try again in a moment.' }, { status: 500 })
  }
}
