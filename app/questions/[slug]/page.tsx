export const revalidate = 86400

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, BrainCircuit, Library, Sparkles, Building2 } from 'lucide-react'
import { getAdminSupabase } from '@/lib/admin'
import { buildQuestionSlug, parseQuestionSlug } from '@/lib/question-slug'

interface Props { params: Promise<{ slug: string }> }

interface QuestionRecord {
  id: number
  question: string
  answer: string
  topic: string
  level: string
  source: 'general' | 'company'
  company?: { name: string; slug: string }
}

async function getQuestion(slug: string): Promise<QuestionRecord | null> {
  const parsed = parseQuestionSlug(slug)
  if (!parsed) return null
  const sb = getAdminSupabase()

  if (parsed.source === 'general') {
    const { data } = await sb
      .from('interview_questions')
      .select('id, question, answer, topic, level')
      .eq('id', parsed.id)
      .single()
    if (!data) return null
    return { ...data, source: 'general' }
  }

  const { data } = await sb
    .from('company_questions')
    .select('id, question, model_answer, topic, level, company_id')
    .eq('id', parsed.id)
    .single()
  if (!data) return null
  const { data: company } = await sb
    .from('companies')
    .select('name, slug')
    .eq('id', data.company_id)
    .single()
  return {
    id: data.id,
    question: data.question,
    answer: data.model_answer,
    topic: data.topic,
    level: data.level,
    source: 'company',
    company: company ?? undefined,
  }
}

async function getRelated(topic: string, source: 'general' | 'company', id: number) {
  const sb = getAdminSupabase()
  const { data } = await sb
    .from('interview_questions')
    .select('id, question, topic, level')
    .eq('topic', topic)
    .neq('id', source === 'general' ? id : -1)
    .limit(6)
  return data ?? []
}

// Pre-render every question page at build time
export async function generateStaticParams() {
  try {
    const sb = getAdminSupabase()
    const [{ data: general }, { data: company }] = await Promise.all([
      sb.from('interview_questions').select('id, question'),
      sb.from('company_questions').select('id, question'),
    ])
    return [
      ...(general ?? []).map(q => ({ slug: buildQuestionSlug('general', q.id, q.question) })),
      ...(company ?? []).map(q => ({ slug: buildQuestionSlug('company', q.id, q.question) })),
    ]
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const q = await getQuestion(slug)
  if (!q) return { title: 'Question Not Found' }
  const title = q.question.length > 60 ? `${q.question.slice(0, 57)}…` : q.question
  const description = `${q.question} — model answer for AI/ML interviews (${q.topic}, ${q.level} level${q.company ? `, asked at ${q.company.name}` : ''}). Free.`
  return {
    title: `${title} | AI/ML Interview Question`,
    description: description.slice(0, 160),
    alternates: { canonical: `https://amanailab.com/questions/${slug}` },
    openGraph: {
      title: q.question,
      description: `Model answer + related ${q.topic} questions. Free AI/ML interview prep.`,
      url: `https://amanailab.com/questions/${slug}`,
      images: [{ url: `/api/og/tool?name=${encodeURIComponent(q.topic + ' Interview Question')}&tagline=${encodeURIComponent(q.question.slice(0, 80))}&emoji=%F0%9F%92%AC&tool=questions`, width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image', title: q.question.slice(0, 70) },
  }
}

const LEVEL_COLORS: Record<string, string> = {
  Fresher: 'bg-green-500/10 border-green-500/30 text-green-400',
  Mid:     'bg-blue-500/10 border-blue-500/30 text-blue-400',
  Senior:  'bg-violet-500/10 border-violet-500/30 text-violet-400',
}

export default async function QuestionPage({ params }: Props) {
  const { slug } = await params
  const q = await getQuestion(slug)
  if (!q) notFound()

  const related = await getRelated(q.topic, q.source, q.id)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'QAPage',
    mainEntity: {
      '@type': 'Question',
      name: q.question,
      text: q.question,
      answerCount: 1,
      acceptedAnswer: { '@type': 'Answer', text: q.answer },
    },
  }
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://amanailab.com' },
      { '@type': 'ListItem', position: 2, name: 'Question Bank', item: 'https://amanailab.com/questions' },
      { '@type': 'ListItem', position: 3, name: q.question.slice(0, 60), item: `https://amanailab.com/questions/${slug}` },
    ],
  }

  return (
    <div className="min-h-screen bg-zinc-950 pt-24 pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <div className="max-w-3xl mx-auto px-4">

        <Link href="/questions" className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> All Questions
        </Link>

        {/* Question */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-semibold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-full">{q.topic}</span>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${LEVEL_COLORS[q.level] ?? 'bg-zinc-800 border-zinc-700 text-zinc-400'}`}>{q.level}</span>
          {q.company && (
            <Link href={`/companies/${q.company.slug}`} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full hover:bg-blue-500/20 transition-colors">
              <Building2 className="w-3 h-3" /> Asked at {q.company.name}
            </Link>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-100 leading-snug mb-8">{q.question}</h1>

        {/* Model answer */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-10">
          <p className="text-xs font-bold text-orange-400 uppercase tracking-wide mb-3">Model Answer</p>
          <div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">{q.answer}</div>
        </div>

        {/* Practice CTAs */}
        <div className="grid sm:grid-cols-2 gap-3 mb-12">
          <Link href={`/interview?topic=${encodeURIComponent(q.topic)}&level=${encodeURIComponent(q.level)}`}
            className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold px-4 py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/20">
            <BrainCircuit className="w-4 h-4" /> Practice {q.topic} in Mock Interview
          </Link>
          <Link href={`/quiz?topic=${encodeURIComponent(q.topic)}`}
            className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-sm font-semibold px-4 py-3.5 rounded-xl transition-colors">
            <Sparkles className="w-4 h-4" /> Take a {q.topic} Quiz
          </Link>
        </div>

        {/* Related questions */}
        {related.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Library className="w-4 h-4 text-orange-400" />
              <h2 className="text-sm font-bold text-zinc-100">More {q.topic} Interview Questions</h2>
            </div>
            <div className="flex flex-col gap-2">
              {related.map(r => (
                <Link key={r.id} href={`/questions/${buildQuestionSlug('general', r.id, r.question)}`}
                  className="group flex items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl px-4 py-3 transition-colors">
                  <span className="text-sm text-zinc-300 group-hover:text-zinc-100 transition-colors leading-snug">{r.question}</span>
                  <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-orange-400 shrink-0 transition-colors" />
                </Link>
              ))}
            </div>
            <Link href="/questions" className="inline-flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 mt-4 transition-colors">
              Browse all questions <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

      </div>
    </div>
  )
}
