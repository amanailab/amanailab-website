import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, BrainCircuit, Lightbulb, Target, Briefcase } from 'lucide-react'
import type { Metadata } from 'next'
import { getAdminSupabase } from '@/lib/admin'
import CompanyQuestions from '@/components/companies/CompanyQuestions'

interface Props { params: Promise<{ slug: string }> }

interface Company {
  id: number; name: string; slug: string; logo_emoji: string
  tagline: string; description: string; hq: string; size: string
  interview_rounds: number; interview_format: string
  what_they_look_for: string[]; tips: string[]
}

interface Question {
  id: number; question: string; model_answer: string; topic: string; level: string
}

async function getData(slug: string) {
  const supabase = getAdminSupabase()
  const [{ data: company }, { data: questions }] = await Promise.all([
    supabase.from('companies').select('*').eq('slug', slug).single(),
    supabase.from('company_questions').select('id, question, model_answer, topic, level')
      .eq('company_id', supabase.from('companies').select('id').eq('slug', slug))
      .order('topic'),
  ])
  if (!company) return null
  const { data: qs } = await supabase
    .from('company_questions')
    .select('id, question, model_answer, topic, level')
    .eq('company_id', (company as Company).id)
    .order('topic')
  return { company: company as Company, questions: (qs ?? []) as Question[] }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const data = await getData(slug)
  if (!data) return { title: 'Company Not Found | AmanAI Lab' }
  const { company } = data
  return {
    title: `${company.name} AI/ML Interview Questions & Prep | AmanAI Lab`,
    description: `Prepare for your ${company.name} interview. Real questions asked at ${company.name}, interview format, what they look for, and insider tips from AmanAI Lab.`,
    openGraph: {
      title: `${company.name} Interview Prep | AmanAI Lab`,
      description: `${company.interview_rounds} interview rounds · ${company.hq} · Practice real ${company.name} AI/ML questions`,
    },
  }
}

export default async function CompanyPage({ params }: Props) {
  const { slug } = await params
  const data = await getData(slug)
  if (!data) notFound()

  const { company, questions } = data

  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: company.name,
    description: company.description ?? company.tagline,
    url: `https://amanailab.com/companies/${company.slug}`,
    address: { '@type': 'PostalAddress', addressLocality: company.hq },
  }

  const faqSchema = questions.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.slice(0, 10).map((q: { question: string; model_answer: string }) => ({
      '@type': 'Question',
      name: `${company.name} Interview: ${q.question}`,
      acceptedAnswer: { '@type': 'Answer', text: q.model_answer },
    })),
  } : null

  return (
    <div className="min-h-screen bg-zinc-950 pt-20 pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
      {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />}
      <div className="max-w-4xl mx-auto px-4">

        {/* Back */}
        <Link href="/companies" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> All Companies
        </Link>

        {/* Hero */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-4 mb-4">
            <span className="text-5xl">{company.logo_emoji}</span>
            <div className="flex-1">
              <h1 className="text-2xl font-extrabold text-zinc-100 mb-1">{company.name}</h1>
              <p className="text-zinc-400 text-sm">{company.tagline}</p>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className="text-xs text-zinc-500">{company.hq}</span>
                <span className="text-zinc-700">·</span>
                <span className="text-xs text-zinc-500">{company.size} employees</span>
                <span className="text-zinc-700">·</span>
                <span className="text-xs text-zinc-500">{company.interview_rounds} interview rounds</span>
              </div>
            </div>
            <Link href="/interview?tab=simulator" className="hidden sm:flex items-center gap-1.5 bg-orange-500 hover:bg-orange-400 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors shrink-0">
              <BrainCircuit className="w-3.5 h-3.5" /> Practice Now
            </Link>
          </div>
          {company.description && <p className="text-sm text-zinc-400 leading-relaxed">{company.description}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {company.interview_format && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Briefcase className="w-4 h-4 text-orange-400" />
                <p className="text-sm font-bold text-zinc-100">Interview Format</p>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed">{company.interview_format}</p>
            </div>
          )}
          {company.what_they_look_for?.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-blue-400" />
                <p className="text-sm font-bold text-zinc-100">What They Look For</p>
              </div>
              <div className="flex flex-col gap-1.5">
                {company.what_they_look_for.map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" /> {item}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {company.tips?.length > 0 && (
          <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-5 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-orange-400" />
              <p className="text-sm font-bold text-orange-300">Insider Tips</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {company.tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                  <span className="text-orange-400 font-bold shrink-0">{i + 1}.</span> {tip}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Questions — client component for filters + expand */}
        <CompanyQuestions questions={questions} />

        <div className="mt-8 flex gap-3">
          <Link href="/interview?tab=simulator" className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/20">
            <BrainCircuit className="w-4 h-4" /> Practice Interview
          </Link>
          <Link href="/companies" className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-sm font-semibold px-5 py-3.5 rounded-xl transition-colors">
            All Companies
          </Link>
        </div>
      </div>
    </div>
  )
}
