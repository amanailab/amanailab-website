import { NextResponse } from 'next/server'
import { callAI } from '@/lib/ai-fallback'
import { getAdminSupabase } from '@/lib/admin'
import { isSdAdmin } from '@/lib/sd-admins'
import { DESIGN_PROBLEM_MAP } from '@/lib/system-design-problems'

export const runtime = 'nodejs'
export const maxDuration = 60

function extractJSON(raw: string): string {
  let s = raw.replace(/<think>[\s\S]*?<\/think>/gi, '')
  const openThink = s.search(/<think>/i)
  if (openThink !== -1) s = s.slice(0, openThink)
  s = s.trim()
  const fenced = s.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
  if (fenced) { const inner = fenced[1].trim(); if (inner.startsWith('{')) return inner }
  const start = s.indexOf('{'); const end = s.lastIndexOf('}')
  if (start !== -1 && end > start) return s.slice(start, end + 1)
  return s
}

function repairJSON(s: string): string {
  return s
    .replace(/,(\s*[}\]])/g, '$1')     // trailing commas
    .replace(/\/\/[^\n]*/g, '')          // // comments
    .replace(/\/\*[\s\S]*?\*\//g, '')    // /* */ comments
}

function strArr(v: unknown, max = 8): string[] {
  if (!Array.isArray(v)) return []
  return v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).slice(0, max)
}

interface PairItem { title: string; detail: string }
function pairArr(v: unknown, aKey: string, bKey: string, max = 8): PairItem[] {
  if (!Array.isArray(v)) return []
  return v
    .map((x): PairItem | null => {
      if (!x || typeof x !== 'object') return null
      const r = x as Record<string, unknown>
      const title  = typeof r[aKey] === 'string' ? (r[aKey] as string).trim() : ''
      const detail = typeof r[bKey] === 'string' ? (r[bKey] as string).trim() : ''
      if (!title) return null
      return { title, detail }
    })
    .filter((x): x is PairItem => !!x)
    .slice(0, max)
}

function normalize(raw: unknown) {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  return {
    overview:     typeof r.overview === 'string' ? r.overview : '',
    architecture: pairArr(r.architecture, 'component', 'purpose'),
    dataModel:    typeof r.dataModel === 'string' ? r.dataModel : '',
    scaling:      strArr(r.scaling),
    tradeoffs:    pairArr(r.tradeoffs, 'choice', 'why'),
    walkthrough:  typeof r.walkthrough === 'string' ? r.walkthrough : '',
  }
}

export async function POST(req: Request) {
  // ── Auth ────────────────────────────────────────────────────────────────
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in to view the reference solution.', code: 'AUTH_REQUIRED' }, { status: 401 })

  // ── Subscription gate (Pro or Bundle) ────────────────────────────────────
  const admin = getAdminSupabase()
  const { data: sub } = await admin
    .from('sd_subscriptions')
    .select('subscribed_until')
    .eq('user_id', user.id)
    .maybeSingle()
  const isSubscribed = (!!sub && new Date(sub.subscribed_until) > new Date()) || isSdAdmin(user.email)
  if (!isSubscribed) {
    return NextResponse.json(
      { error: 'Reference solutions are a Pro feature.', code: 'PAYWALL' },
      { status: 402 },
    )
  }

  const { slug } = await req.json().catch(() => ({ slug: '' }))
  const problem = typeof slug === 'string' ? DESIGN_PROBLEM_MAP[slug] : undefined
  if (!problem) return NextResponse.json({ error: 'Unknown problem.' }, { status: 404 })

  // ── Cache: generate once per problem, reuse for everyone ──────────────────
  try {
    const { data: cached } = await admin
      .from('sd_reference_solutions')
      .select('content')
      .eq('slug', slug)
      .maybeSingle()
    if (cached?.content) return NextResponse.json({ reference: cached.content, cached: true })
  } catch { /* table may not exist yet — generate without cache */ }

  // Per-user guard against hammering the generator on cache misses
  const { checkRateLimit } = await import('@/lib/rate-limit')
  const rl = checkRateLimit(`sd-reference:${user.id}`, 5, 60_000)
  if (!rl.allowed) return NextResponse.json({ error: 'Please wait a moment and try again.' }, { status: 429 })

  try {
    const raw = await callAI({
      messages: [
        {
          role: 'system',
          content: 'You are a staff ML systems engineer writing the model answer for a system design interview question. Be concrete and senior-level. Return ONLY valid JSON, no markdown fences.',
        },
        {
          role: 'user',
          content: `Write the ideal reference solution for this system design interview question.

QUESTION: ${problem.problem}
CATEGORY: ${problem.category}
KEY AREAS THE ANSWER MUST COVER:
${problem.keyAreas.map((a, i) => `${i + 1}. ${a}`).join('\n')}

Return JSON only:
{"overview":"<2-3 sentences framing the problem, scale assumptions, and the core approach>","architecture":[{"component":"<name>","purpose":"<why it's here + key choice>"}],"dataModel":"<schema/storage choices and why (SQL vs NoSQL, partitioning, indexes)>","scaling":["<specific scaling/bottleneck decision>","<caching/sharding/fault-tolerance decision>"],"tradeoffs":[{"choice":"<decision made>","why":"<alternative rejected and reasoning>"}],"walkthrough":"<how a strong candidate would present this end-to-end in the interview, 4-6 sentences>"}

Make architecture 5-7 components, scaling 3-5 items, tradeoffs 3-4 items. Be specific to THIS question, not generic.`,
        },
      ],
      temperature: 0.3,
      max_tokens:  2600,
    })

    let parsed: unknown
    const cleaned = extractJSON(typeof raw === 'string' ? raw : JSON.stringify(raw))
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      try {
        parsed = JSON.parse(repairJSON(cleaned))   // second pass: fix trailing commas/comments
      } catch {
        console.error('[system-design/reference] parse failed:', typeof raw === 'string' ? raw.slice(0, 400) : raw)
        return NextResponse.json({ error: 'Could not generate the reference solution. Please retry.' }, { status: 500 })
      }
    }

    const reference = normalize(parsed)

    // Store for reuse (best-effort)
    void admin.from('sd_reference_solutions').insert({ slug, content: reference }).then(({ error }) => {
      if (error && error.code !== '23505') console.error('[system-design/reference] cache insert failed:', error.message)
    })

    return NextResponse.json({ reference, cached: false })
  } catch (err) {
    console.error('[system-design/reference]', err)
    return NextResponse.json({ error: 'Reference generation failed. Please try again.' }, { status: 500 })
  }
}
