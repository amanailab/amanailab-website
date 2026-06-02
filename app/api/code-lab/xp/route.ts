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

// POST /api/code-lab/xp — body: { delta: number } — adds XP, returns { xp: number }
export async function POST(req: NextRequest) {
  try {
    const supabase = await createAuthClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Cap the per-call award. The largest legitimate single solve is 250
    // (Hard: 100 base + 50 speed bonus + 100 first-solve bonus), so anything
    // above 300 is forged. This blocks `{delta: 999999999}` leaderboard fraud.
    // (XP is still client-initiated; a fuller fix would recompute it server-side
    // from a verified solve, but capping removes the abusive blast radius.)
    const MAX_DELTA = 300
    const { delta } = await req.json()
    if (typeof delta !== 'number' || !Number.isFinite(delta) || delta <= 0) {
      return NextResponse.json({ error: 'Invalid delta' }, { status: 400 })
    }
    const safeDelta = Math.min(Math.floor(delta), MAX_DELTA)

    const sb = admin()

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
