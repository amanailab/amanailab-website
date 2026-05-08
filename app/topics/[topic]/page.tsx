import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft, BrainCircuit, CheckCircle2, Lightbulb, ChevronDown, ChevronUp, BookOpen } from 'lucide-react'
import { TOPIC_MAP, SLUG_TO_DB_TOPIC } from '@/lib/topic-data'
import { getAdminSupabase } from '@/lib/admin'

interface Props { params: Promise<{ topic: string }> }

export async function generateStaticParams() {
  return Object.keys(TOPIC_MAP).map(slug => ({ topic: slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic: slug } = await params
  const meta = TOPIC_MAP[slug]
  if (!meta) return { title: 'Topic Not Found | AmanAI Lab' }
  return {
    title: meta.seoTitle,
    description: meta.seoDescription,
    openGraph: { title: meta.seoTitle, description: meta.seoDescription },
  }
}

async function getQuestions(dbTopic: string) {
  const supabase = getAdminSupabase()
  const [{ data: general }, { data: companyQs }] = await Promise.all([
    supabase.from('interview_questions').select('id, question, answer, level').eq('topic', dbTopic).order('id', { ascending: false }),
    supabase.from('company_questions')
      .select('id, question, model_answer, level, company_id, companies(name, slug)')
      .eq('topic', dbTopic)
      .order('id', { ascending: false }),
  ])
  return { general: general ?? [], companyQs: companyQs ?? [] }
}

// Inline expandable question (server component renders static, no JS needed for first paint)
function QuestionItem({ question, answer, level, company }: {
  question: string; answer: string; level: string; company?: string; companySlug?: string
}) {
  return (
    <details className="group bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <summary className="flex items-start gap-3 p-4 cursor-pointer list-none hover:bg-zinc-800/30 transition-colors">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className="text-[10px] text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-700">{level}</span>
            {company && <span className="text-[10px] text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full">{company}</span>}
          </div>
          <p className="text-sm text-zinc-200 leading-relaxed">{question}</p>
        </div>
        <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5 group-open:hidden" />
        <ChevronUp className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5 hidden group-open:block" />
      </summary>
      <div className="px-4 pb-4 border-t border-zinc-800">
        <div className="flex items-start gap-2 mt-3">
          <Lightbulb className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-orange-400 uppercase tracking-wide mb-1.5">Model Answer</p>
            <p className="text-sm text-zinc-300 leading-relaxed">{answer}</p>
          </div>
        </div>
      </div>
    </details>
  )
}

export default async function TopicPage({ params }: Props) {
  const { topic: slug } = await params
  const meta = TOPIC_MAP[slug]
  if (!meta) notFound()

  const dbTopic = SLUG_TO_DB_TOPIC[slug]
  const { general, companyQs } = await getQuestions(dbTopic)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allQuestions = [
    ...companyQs.map((q: any) => ({
      id: `c-${q.id}`, question: q.question, answer: q.model_answer,
      level: q.level, company: q.companies?.name, companySlug: q.companies?.slug,
    })),
    ...general.map((q: any) => ({
      id: `g-${q.id}`, question: q.question, answer: q.answer,
      level: q.level, company: undefined, companySlug: undefined,
    })),
  ]

  return (
    <div className="min-h-screen bg-zinc-950 pt-20 pb-16">
      <div className="max-w-4xl mx-auto px-4">

        <Link href="/topics" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> All Topics
        </Link>

        {/* Hero */}
        <div className="mb-8">
          <div className={`inline-flex text-sm font-bold px-3 py-1 rounded-full border mb-4 ${meta.bg} ${meta.color}`}>
            {meta.label}
          </div>
          <h1 className="text-3xl font-extrabold text-zinc-100 mb-3">
            {meta.label} Interview Questions
          </h1>
          <p className="text-zinc-400 leading-relaxed max-w-2xl">{meta.description}</p>
        </div>

        {/* Key concepts */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <p className="text-sm font-bold text-zinc-100">Key Concepts to Know</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {meta.concepts.map((c) => (
              <div key={c} className={`text-xs font-medium px-3 py-2 rounded-xl border text-center ${meta.bg} ${meta.color}`}>
                {c}
              </div>
            ))}
          </div>
        </div>

        {/* Practice CTA */}
        <div className={`${meta.bg} border rounded-2xl p-5 mb-8 flex items-center gap-4`} style={{ borderColor: 'inherit' }}>
          <div className="flex-1">
            <p className="text-sm font-bold text-zinc-100 mb-1">Practice {meta.label} with AI</p>
            <p className="text-xs text-zinc-400">Timed session with instant scoring, voice support, and model answers.</p>
          </div>
          <div className="flex gap-2 shrink-0 flex-wrap">
            <Link href={`/flashcards/${slug}`}
              className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs font-semibold px-3 py-2 rounded-xl transition-colors">
              <BookOpen className="w-3.5 h-3.5" /> Flashcards
            </Link>
            <Link href="/interview?tab=simulator"
              className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-400 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors">
              <BrainCircuit className="w-3.5 h-3.5" /> Practice Now
            </Link>
          </div>
        </div>

        {/* Questions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-zinc-100">
              {allQuestions.length > 0 ? `${allQuestions.length} Interview Questions` : 'Interview Questions'}
            </p>
            <Link href="/questions" className="text-xs text-orange-400 hover:text-orange-300 font-semibold">
              Browse all topics →
            </Link>
          </div>

          {allQuestions.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
              <BrainCircuit className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500 text-sm mb-4">Questions for this topic coming soon.</p>
              <Link href="/interview?tab=simulator" className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
                <BrainCircuit className="w-4 h-4" /> Practice {meta.label} Now
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {allQuestions.map(q => (
                <QuestionItem key={q.id} question={q.question} answer={q.answer}
                  level={q.level} company={q.company} companySlug={q.companySlug} />
              ))}
            </div>
          )}
        </div>

        {/* Related topics */}
        <div className="mt-10">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Related Topics</p>
          <div className="flex flex-wrap gap-2">
            {Object.values(TOPIC_MAP).filter(t => t.slug !== slug).slice(0, 6).map(t => (
              <Link key={t.slug} href={`/topics/${t.slug}`}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all hover:brightness-125 ${t.bg} ${t.color}`}>
                {t.label}
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
