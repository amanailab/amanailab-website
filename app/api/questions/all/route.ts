import { NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/admin'

export const runtime = 'nodejs'

export async function GET() {
  const supabase = getAdminSupabase()

  const [{ data: general }, { data: companyQs }, { data: companies }] = await Promise.all([
    supabase.from('interview_questions').select('id, question, answer, topic, level').order('id', { ascending: false }),
    supabase.from('company_questions').select('id, question, model_answer, topic, level, company_id').order('id', { ascending: false }),
    supabase.from('companies').select('id, name, slug'),
  ])

  const companyMap = Object.fromEntries((companies ?? []).map(c => [c.id, c]))

  const generalMapped = (general ?? []).map(q => ({
    id: `g-${q.id}`,
    question: q.question,
    model_answer: q.answer,
    topic: q.topic,
    level: q.level,
    source: 'general' as const,
  }))

  const companyMapped = (companyQs ?? []).map(q => {
    const c = companyMap[q.company_id]
    return {
      id: `c-${q.id}`,
      question: q.question,
      model_answer: q.model_answer,
      topic: q.topic,
      level: q.level,
      company: c?.name,
      company_slug: c?.slug,
      source: 'company' as const,
    }
  })

  return NextResponse.json({
    questions: [...companyMapped, ...generalMapped],
    companies: companies ?? [],
  })
}
