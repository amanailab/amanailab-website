export const revalidate = 86400 // questions rarely change — rebuild once a day

import type { Metadata } from 'next'
import { Library, BookmarkCheck } from 'lucide-react'
import Link from 'next/link'
import { getAdminSupabase } from '@/lib/admin'
import QuestionsClient from '@/components/questions/QuestionsClient'

export const metadata: Metadata = {
  title: 'AI/ML Interview Question Bank',
  description: 'Browse 500+ AI/ML interview questions covering LLM, RAG, Agents, MLOps, System Design and more. Filter by topic, level, and company. Free.',
  alternates: { canonical: 'https://amanailab.com/questions' },
  openGraph: {
    title: 'AI/ML Interview Question Bank',
    description: '500+ real AI/ML interview questions with model answers. Filter by topic, level, and company.',
  },
}

async function getQuestions() {
  const supabase = getAdminSupabase()
  const [{ data: general }, { data: companyQs }, { data: companies }] = await Promise.all([
    supabase.from('interview_questions').select('id, question, answer, topic, level').order('id', { ascending: false }),
    supabase.from('company_questions').select('id, question, model_answer, topic, level, company_id').order('id', { ascending: false }),
    supabase.from('companies').select('id, name, slug').order('name'),
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

  return {
    questions: [...companyMapped, ...generalMapped],
    companies: (companies ?? []) as { id: number; name: string; slug: string }[],
  }
}

export default async function QuestionsPage() {
  const { questions, companies } = await getQuestions()

  // FAQ schema — first 25 questions for rich results in Google
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.slice(0, 25).map(q => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: { '@type': 'Answer', text: q.model_answer },
    })),
  }

  return (
    <div className="min-h-screen bg-zinc-950 pt-20 pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-1.5 mb-4">
            <Library className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-xs font-semibold text-orange-400 uppercase tracking-wide">Question Bank</span>
          </div>
          <h1 className="text-3xl font-extrabold text-zinc-100 mb-2">AI/ML Interview Question Bank</h1>
          <p className="text-zinc-400 text-sm mb-3">{questions.length} questions · Browse, filter, and study at your own pace</p>
          <Link href="/questions/saved"
            className="inline-flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-full transition-colors">
            <BookmarkCheck className="w-3.5 h-3.5" /> View Saved Questions
          </Link>
        </div>

        <QuestionsClient
          initialQuestions={questions}
          companies={companies}
          totalCount={questions.length}
        />
      </div>
    </div>
  )
}
