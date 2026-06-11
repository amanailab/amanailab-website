import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAuthClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
}

// GET /api/code-lab/xp — returns { xp: number } for logged-in user
export async function GET() {
  try {
    const supabase = await createAuthClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ xp: 0 })

    const { data } = await admin()
      .from('user_xp')
      .select('xp')
      .eq('user_id', user.id)
      .single()

    return NextResponse.json({ xp: data?.xp ?? 0 })
  } catch {
    return NextResponse.json({ xp: 0 })
  }
}

// Mirrors XP_MAP in app/code-lab/[slug]/ProblemClient.tsx
const XP_MAP: Record<string, number> = { Easy: 20, Medium: 50, Hard: 100 }

// POST /api/code-lab/xp — body: { delta: number, problem_id: string }
// Validates the award server-side: the cap is derived from the problem's real
// difficulty (base + 50% speed bonus + first-solve bonus = 2.5×base), and XP is
// denied entirely if the user already has an Accepted submission for the
// problem — so replaying the request can't farm the leaderboard.
export async function POST(req: NextRequest) {
  try {
    const supabase = await createAuthClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { delta, problem_id } = await req.json()
    if (typeof delta !== 'number' || !Number.isFinite(delta) || delta <= 0) {
      return NextResponse.json({ error: 'Invalid delta' }, { status: 400 })
    }
    if (!problem_id || (typeof problem_id !== 'string' && typeof problem_id !== 'number')) {
      return NextResponse.json({ error: 'Missing problem_id' }, { status: 400 })
    }

    const sb = admin()

    // Resolve the problem's difficulty (DB first, static fallback for seeded problems)
    const { data: problem } = await sb
      .from('code_problems')
      .select('difficulty')
      .eq('id', problem_id)
      .single()
    const { STATIC_PROBLEMS_MAP } = await import('@/lib/code-problems-static')
    const difficulty = problem?.difficulty ?? STATIC_PROBLEMS_MAP[String(problem_id)]?.difficulty
    if (!difficulty) return NextResponse.json({ error: 'Unknown problem' }, { status: 400 })

    // Deny if this problem was already solved — XP is first-solve only
    const { data: prior } = await sb
      .from('code_submissions')
      .select('id')
      .eq('user_id', user.id)
      .eq('problem_id', problem_id)
      .eq('status', 'Accepted')
      .limit(1)
    if (prior && prior.length > 0) {
      const { data: current } = await sb.from('user_xp').select('xp').eq('user_id', user.id).single()
      return NextResponse.json({ xp: current?.xp ?? 0 })
    }

    const base = XP_MAP[difficulty] ?? 20
    const maxAward = Math.round(base * 2.5)
    const safeDelta = Math.min(Math.floor(delta), maxAward)

    // Upsert — add delta to existing XP
    const { data: existing } = await sb
      .from('user_xp')
      .select('xp')
      .eq('user_id', user.id)
      .single()

    const newXp = (existing?.xp ?? 0) + safeDelta

    await sb.from('user_xp').upsert({
      user_id: user.id,
      xp: newXp,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    return NextResponse.json({ xp: newXp })
  } catch (e) {
    console.error('[code-lab/xp]', e)
    return NextResponse.json({ error: 'Failed to update XP' }, { status: 500 })
  }
}
