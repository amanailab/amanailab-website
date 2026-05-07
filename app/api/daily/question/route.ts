import { NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/admin'

export const runtime = 'nodejs'

function todayIndex(): number {
  // Deterministic: every user gets the same question on the same UTC day
  return Math.floor(Date.now() / 86400000)
}

export async function GET() {
  try {
    const supabase = getAdminSupabase()

    const { data: questions, error } = await supabase
      .from('interview_questions')
      .select('id, question, topic, level')
      .order('id', { ascending: true })

    if (error || !questions || questions.length === 0) {
      return NextResponse.json({ error: 'No questions available' }, { status: 404 })
    }

    const idx = todayIndex() % questions.length
    const q = questions[idx]
    const date = new Date().toISOString().split('T')[0]

    return NextResponse.json({
      date,
      question: { id: q.id, question: q.question, topic: q.topic, level: q.level },
    })
  } catch (err) {
    console.error('[Daily Question]', err)
    return NextResponse.json({ error: 'Failed to fetch question' }, { status: 500 })
  }
}
