import { NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/admin'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug') ?? ''
  if (!slug) return NextResponse.json({ answers: [] })

  const admin = getAdminSupabase()
  const { data } = await admin
    .from('sd_community_answers')
    .select('id, problem_slug, design_text, score, grade, upvotes, created_at')
    .eq('problem_slug', slug)
    .order('score', { ascending: false })
    .order('upvotes', { ascending: false })
    .limit(10)

  return NextResponse.json({ answers: data ?? [] })
}
