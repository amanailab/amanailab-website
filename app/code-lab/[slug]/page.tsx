import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAdminSupabase } from '@/lib/admin'
import { STATIC_PROBLEMS_MAP } from '@/lib/code-problems-static'
import ProblemClient from './ProblemClient'

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const sb = getAdminSupabase()
  const { data } = await sb.from('code_problems').select('title, difficulty, topic').eq('slug', slug).single()
  const staticFallback = STATIC_PROBLEMS_MAP[slug]
  if (!data && !staticFallback) return { title: 'Problem' }
  const meta = data ?? staticFallback
  if (!meta) return { title: 'Problem' }
  return {
    title: `${meta.title} (${meta.difficulty}) | AI Code Lab`,
    description: `Solve ${meta.title} — ${meta.topic} coding problem for AI/ML engineers. Free.`,
    alternates: { canonical: `https://amanailab.com/code-lab/${slug}` },
  }
}

export default async function ProblemPage({ params }: Props) {
  const { slug } = await params
  const sb = getAdminSupabase()

  const { data: dbProblem } = await sb.from('code_problems').select('*').eq('slug', slug).single()
  const staticProblem = STATIC_PROBLEMS_MAP[slug]
  const problem = dbProblem ?? (staticProblem ? { ...staticProblem, id: slug, created_at: new Date().toISOString() } : null)
  if (!problem) notFound()

  // Fetch adjacent + similar problems
  const [{ data: prevArr }, { data: nextArr }, { data: allProblems }, { data: similarArr }] = await Promise.all([
    sb.from('code_problems')
      .select('slug, title, difficulty')
      .lt('order_index', problem.order_index)
      .order('order_index', { ascending: false })
      .limit(1),
    sb.from('code_problems')
      .select('slug, title, difficulty')
      .gt('order_index', problem.order_index)
      .order('order_index', { ascending: true })
      .limit(1),
    sb.from('code_problems')
      .select('id')
      .order('order_index'),
    sb.from('code_problems')
      .select('slug, title, difficulty, topic')
      .eq('topic', problem.topic)
      .neq('slug', slug)
      .order('order_index')
      .limit(3),
  ])

  const prevProblem    = prevArr?.[0] ?? null
  const nextProblem    = nextArr?.[0] ?? null
  const totalProblems  = allProblems?.length ?? 0
  const similarProblems = similarArr ?? []

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://amanailab.com' },
      { '@type': 'ListItem', position: 2, name: 'Code Lab', item: 'https://amanailab.com/code-lab' },
      { '@type': 'ListItem', position: 3, name: problem.title, item: `https://amanailab.com/code-lab/${problem.slug}` },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <ProblemClient
        problem={problem}
        prevProblem={prevProblem}
        nextProblem={nextProblem}
        totalProblems={totalProblems}
        similarProblems={similarProblems}
      />
    </>
  )
}
