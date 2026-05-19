import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

interface SaveBody {
  problem_slug: string
  problem_title: string
  design: string
  checklist?: Record<string, boolean>
  word_count?: number
  review?: {
    overallScore?: number
    grade?: string
    summary?: string
    [key: string]: unknown
  } | null
}

// GET — list the current user's submissions (most recent first)
export async function GET() {
  try {
    const sb = await createClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return NextResponse.json({ items: [] })

    const { data, error } = await sb
      .from('system_design_submissions')
      .select('id, problem_slug, problem_title, word_count, review_score, review_grade, review_summary, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(50)

    if (error) return NextResponse.json({ items: [] })
    return NextResponse.json({ items: data ?? [] })
  } catch {
    return NextResponse.json({ items: [] })
  }
}

// POST — upsert design + (optional) review for the (user, problem_slug) pair
export async function POST(req: Request) {
  try {
    const sb = await createClient()
    const { data: { user } } = await sb.auth.getUser()
    // Logged-out users save to localStorage on the client; nothing to do here.
    if (!user) return NextResponse.json({ ok: true, saved: false })

    const body = (await req.json()) as SaveBody
    if (!body.problem_slug || !body.problem_title || typeof body.design !== 'string') {
      return NextResponse.json({ error: 'problem_slug, problem_title and design are required' }, { status: 400 })
    }
    if (body.design.length > 50_000) {
      return NextResponse.json({ error: 'Design too long (50k char limit)' }, { status: 400 })
    }

    const row = {
      user_id:       user.id,
      problem_slug:  body.problem_slug,
      problem_title: body.problem_title,
      design:        body.design,
      checklist:     body.checklist ?? {},
      word_count:    typeof body.word_count === 'number' ? body.word_count : null,
      review_score:  body.review && typeof body.review.overallScore === 'number' ? body.review.overallScore : null,
      review_grade:  body.review && typeof body.review.grade === 'string' ? body.review.grade : null,
      review_summary:body.review && typeof body.review.summary === 'string' ? body.review.summary : null,
      review_json:   body.review ?? null,
      updated_at:    new Date().toISOString(),
    }

    const { error } = await sb
      .from('system_design_submissions')
      .upsert(row, { onConflict: 'user_id,problem_slug' })

    if (error) {
      console.error('[system-design/submissions]', error.message)
      return NextResponse.json({ error: 'Save failed' }, { status: 500 })
    }
    return NextResponse.json({ ok: true, saved: true })
  } catch (err) {
    console.error('[system-design/submissions]', err)
    return NextResponse.json({ error: 'Save failed' }, { status: 500 })
  }
}
