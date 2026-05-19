import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAuth } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
}

// POST /api/daily/save
// Body: { date: "2026-05-12", questionId: number, score: number }
// Saves completion and awards 15 XP for completing daily challenge
export async function POST(req: NextRequest) {
  try {
    const supabase = await createAuth()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ ok: true }) // silently ignore for logged-out

    const { date, questionId, score: rawScore } = await req.json()
    if (!date) return NextResponse.json({ error: 'date required' }, { status: 400 })

    // Validate date is today or yesterday (server time) to prevent fake streak manipulation
    const serverToday = new Date().toISOString().split('T')[0]
    const serverYesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    if (date !== serverToday && date !== serverYesterday) {
      return NextResponse.json({ error: 'invalid date' }, { status: 400 })
    }

    // Clamp client-supplied score to valid range
    const score = typeof rawScore === 'number' ? Math.max(0, Math.min(10, Math.round(rawScore))) : null

    const sb = admin()

    // Upsert completion (one per user per day — no duplicates)
    const { error } = await sb.from('daily_completions').upsert({
      user_id:     user.id,
      date,
      question_id: questionId ?? null,
      score:       score ?? null,
    }, { onConflict: 'user_id,date', ignoreDuplicates: true })

    if (error && !error.message.includes('already exists')) {
      console.error('[daily/save]', error.message)
    }

    // Award XP only once per day — re-fetch after upsert to avoid TOCTOU race
    const { data: existing } = await sb
      .from('daily_completions')
      .select('xp_awarded')
      .eq('user_id', user.id)
      .eq('date', date)
      .single()

    let xpAwarded = 0
    if (!existing?.xp_awarded) {
      // Atomically flip xp_awarded false → true. The .select() returns only rows
      // actually updated, so concurrent requests racing on the same day will see
      // an empty array on the loser and skip awarding XP.
      const { data: claimed, error: markErr } = await sb.from('daily_completions')
        .update({ xp_awarded: true })
        .eq('user_id', user.id)
        .eq('date', date)
        .eq('xp_awarded', false)
        .select('user_id')

      if (!markErr && claimed && claimed.length > 0) {
        // Flat XP — not based on client-supplied score to prevent manipulation
        xpAwarded = 15

        const { data: xpRow } = await sb.from('user_xp').select('xp').eq('user_id', user.id).single()
        const MAX_XP = 10_000_000
        const newXp = Math.min((xpRow?.xp ?? 0) + xpAwarded, MAX_XP)
        await sb.from('user_xp').upsert({ user_id: user.id, xp: newXp, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
      }
    }

    return NextResponse.json({ ok: true, xp_awarded: xpAwarded })
  } catch {
    return NextResponse.json({ ok: true }) // non-critical — don't break daily challenge
  }
}

// GET /api/daily/save — returns server-side streak for logged-in user
export async function GET() {
  try {
    const supabase = await createAuth()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ streak: 0, dates: [] })

    const sb = admin()
    const { data } = await sb
      .from('daily_completions')
      .select('date')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(365)

    const dates = (data ?? []).map(r => r.date as string)
    return NextResponse.json({ streak: 0, dates })
  } catch {
    return NextResponse.json({ streak: 0, dates: [] })
  }
}
