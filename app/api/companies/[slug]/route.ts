import { NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/admin'

export const runtime = 'nodejs'

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = getAdminSupabase()

  const [{ data: company }, { data: questions }] = await Promise.all([
    supabase.from('companies').select('*').eq('slug', slug).single(),
    supabase.from('company_questions').select('id, question, model_answer, topic, level')
      .eq('company_id', supabase.from('companies').select('id').eq('slug', slug))
      .order('id'),
  ])

  if (!company) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Fetch questions properly
  const { data: qs } = await supabase
    .from('company_questions')
    .select('id, question, model_answer, topic, level')
    .eq('company_id', company.id)
    .order('topic')

  return NextResponse.json({ company, questions: qs ?? [] })
}
