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
  return { title: `${data.title} (${data.difficulty}) | AI Code Lab`, description: `Solve ${data.title} — ${data.topic} problem for AI/ML engineers.` }
}

export default async function ProblemPage({ params }: Props) {
  const { slug } = await params
  const sb = getAdminSupabase()
  const { data: problem } = await sb
    .from('code_problems')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!problem) notFound()
  return <ProblemClient problem={problem} />
}
