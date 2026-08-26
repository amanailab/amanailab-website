import { NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/admin'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })

  const body = await req.json()
  const slug        = typeof body?.slug        === 'string' ? body.slug.trim()   : ''
  const design_text = typeof body?.design_text === 'string' ? body.design_text   : ''
  const score       = typeof body?.score       === 'number' ? body.score         : 0
  const grade       = typeof body?.grade       === 'string' ? body.grade.toUpperCase() : ''

  if (!slug || !design_text || !['A','B'].includes(grade) || score < 7) {
    return NextResponse.json({ error: 'Only A or B grade answers (score ≥ 7) can be shared.' }, { status: 400 })
  }

  const admin = getAdminSupabase()

  // Upsert — one answer per user per problem
  const { error } = await admin
    .from('sd_community_answers')
    .upsert({
      user_id:      user.id,
      problem_slug: slug,
      design_text:  design_text.slice(0, 12000),
      score,
      grade,
    }, { onConflict: 'user_id,problem_slug' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug') ?? ''

  const admin = getAdminSupabase()
  await admin.from('sd_community_answers').delete()
    .eq('user_id', user.id)
    .eq('problem_slug', slug)

  return NextResponse.json({ ok: true })
}
