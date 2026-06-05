export const revalidate = 86400 // questions rarely change — rebuild once a day

import { Suspense } from 'react'
import type { Metadata } from 'next'
import { Library, BookmarkCheck } from 'lucide-react'
import Link from 'next/link'
import { getAdminSupabase } from '@/lib/admin'
import { SITE_STATS } from '@/lib/site-stats'
import QuestionsClient from '@/components/questions/QuestionsClient'

export const metadata: Metadata = {
  title: `Free AI/ML Interview Questions — ${SITE_STATS.questions} Questions with Model Answers`,
  description: `Browse ${SITE_STATS.questions} real AI/ML interview questions with model answers. Filter by topic (LLM, RAG, Agents, MLOps, System Design), level (Fresher/Mid/Senior), and company (Google, Meta, OpenAI). Free.`,
  alternates: { canonical: 'https://amanailab.com/questions' },
  openGraph: {
    title: `${SITE_STATS.questions} Free AI/ML Interview Questions with Answers`,
    description: 'Filter by topic, level, and company. LLM, RAG, Agents, Transformers, MLOps, System Design and more. Model answers included.',
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

  const staticFaqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      { '@type': 'Question', name: 'How many AI/ML interview questions are available?', acceptedAnswer: { '@type': 'Answer', text: `${SITE_STATS.questions} questions covering 14 topics: LLM, RAG, Agents, Fine-Tuning, MLOps, Transformers, System Design, Python, Vector DB, Computer Vision, NLP, Statistics, SQL & Data, and Behavioral.` } },
      { '@type': 'Question', name: 'Are all interview questions free?', acceptedAnswer: { '@type': 'Answer', text: `Yes. All ${SITE_STATS.questions} questions with model answers are completely free — no login required.` } },
      { '@type': 'Question', name: 'Can I filter by company?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Filter by companies including Google, Meta, OpenAI, Anthropic, Microsoft, Amazon, and more to see role-specific questions.' } },
      { '@type': 'Question', name: 'Do questions come with model answers?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Click any question to expand a detailed model answer written by AI/ML interview experts.' } },
      { '@type': 'Question', name: 'Can I bookmark questions for later review?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Click the bookmark icon on any question to save it. Filter by "Saved" to review your bookmarked questions.' } },
    ],
  }

  return (
    <div className="min-h-screen bg-zinc-950 pt-20 pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(staticFaqJsonLd) }} />
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-1.5 mb-4">
            <Library className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-xs font-semibold text-orange-400 uppercase tracking-wide">Question Bank</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-zinc-100 mb-2">AI/ML Interview Question Bank</h1>
          <p className="text-zinc-400 text-sm mb-3">{questions.length} questions · Browse, filter, and study at your own pace</p>
          <Link href="/questions/saved"
            className="inline-flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-full transition-colors">
            <BookmarkCheck className="w-3.5 h-3.5" /> View Saved Questions
          </Link>
        </div>

        <Suspense fallback={null}>
          <QuestionsClient
            initialQuestions={questions}
            companies={companies}
            totalCount={questions.length}
          />
        </Suspense>
      </div>
    </div>
  )
}
