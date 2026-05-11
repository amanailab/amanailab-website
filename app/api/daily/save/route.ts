import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAuth } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
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

    const { date, questionId, score } = await req.json()
    if (!date) return NextResponse.json({ error: 'date required' }, { status: 400 })

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

    // Award 15 XP for completing today's challenge (only once per day)
    const { data: existing } = await sb
      .from('daily_completions')
      .select('xp_awarded')
      .eq('user_id', user.id)
      .eq('date', date)
      .single()

    let xpAwarded = 0
    if (!existing?.xp_awarded) {
      const baseXp = 15 + (score >= 9 ? 10 : score >= 7 ? 5 : 0)
      xpAwarded = baseXp

      // Mark XP as awarded
      await sb.from('daily_completions').update({ xp_awarded: true })
        .eq('user_id', user.id).eq('date', date)

      // Add to user_xp
      const { data: xpRow } = await sb.from('user_xp').select('xp').eq('user_id', user.id).single()
      const newXp = (xpRow?.xp ?? 0) + xpAwarded
      await sb.from('user_xp').upsert({ user_id: user.id, xp: newXp, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
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
