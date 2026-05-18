import { createClient } from '@/lib/supabase/server'
import { getAdminSupabase } from '@/lib/admin'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

// XP awarded for completing an interview session based on avg score
function calcSessionXp(avg_score: number, question_count: number): number {
  const base    = Math.round(question_count * 5)           // 5 XP per question
  const bonus   = avg_score >= 9 ? 30 : avg_score >= 7 ? 15 : avg_score >= 5 ? 5 : 0
  return base + bonus
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const topic = typeof body.topic === 'string' ? body.topic.slice(0, 100) : ''
    const level = typeof body.level === 'string' ? body.level.slice(0, 50) : ''
    const question_count = typeof body.question_count === 'number' ? Math.max(0, Math.min(100, Math.round(body.question_count))) : 0
    const avg_score = typeof body.avg_score === 'number' ? Math.max(0, Math.min(10, body.avg_score)) : 0
    const grade = typeof body.grade === 'string' ? body.grade.slice(0, 20) : ''
    const entries = Array.isArray(body.entries) ? body.entries.slice(0, 50) : []

    const { error } = await supabase.from('user_interview_sessions').insert({
      user_id: user.id, topic, level, question_count, avg_score, grade, entries,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Award XP for completing the session
    const xpEarned = calcSessionXp(avg_score ?? 0, question_count ?? 0)
    if (xpEarned > 0) {
      const sb = getAdminSupabase()
      const { data: existing } = await sb.from('user_xp').select('xp').eq('user_id', user.id).single()
      const newXp = (existing?.xp ?? 0) + xpEarned
      await sb.from('user_xp').upsert({ user_id: user.id, xp: newXp, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    }

    return NextResponse.json({ success: true, xp_earned: xpEarned })
  } catch {
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
