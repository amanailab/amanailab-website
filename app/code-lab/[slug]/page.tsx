import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAdminSupabase } from '@/lib/admin'
import ProblemClient from './ProblemClient'

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const sb = getAdminSupabase()
  const { data } = await sb.from('code_problems').select('title, difficulty, topic').eq('slug', slug).single()
  if (!data) return { title: 'Problem | AmanAI Lab' }
  return {
    title: `${data.title} (${data.difficulty}) | AI Code Lab`,
    description: `Solve ${data.title} — ${data.topic} coding problem for AI/ML engineers. Free.`,
  }
}

export default async function ProblemPage({ params }: Props) {
  const { slug } = await params
  const sb = getAdminSupabase()

  const { data: problem } = await sb.from('code_problems').select('*').eq('slug', slug).single()
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

  return (
    <ProblemClient
      problem={problem}
      prevProblem={prevProblem}
      nextProblem={nextProblem}
      totalProblems={totalProblems}
      similarProblems={similarProblems}
    />
  )
}
