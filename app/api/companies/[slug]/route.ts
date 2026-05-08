import { NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/admin'

export const runtime = 'nodejs'

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const supabase  = getAdminSupabase()

    const { data: company, error } = await supabase
      .from('companies')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error || !company) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { data: questions } = await supabase
      .from('company_questions')
      .select('id, question, model_answer, topic, level')
      .eq('company_id', company.id)
      .order('topic')

    return NextResponse.json({ company, questions: questions ?? [] })
  } catch (err) {
    console.error('[companies/slug]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
