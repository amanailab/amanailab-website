import type { Metadata } from 'next'
import { getAdminSupabase } from '@/lib/admin'
import ProblemsClient from './ProblemsClient'

export const metadata: Metadata = {
  title: 'AI/ML Code Lab | AmanAI Lab',
  description: '20+ AI/ML coding problems — implement softmax, attention, RAG, KNN and more from scratch. LeetCode-style judge for AI engineers.',
  alternates: { canonical: 'https://amanailab.com/code-lab' },
}

async function getProblems() {
  const sb = getAdminSupabase()
  const { data } = await sb
    .from('code_problems')
    .select('id, title, slug, difficulty, topic, tags, companies, order_index')
    .order('order_index', { ascending: true })
  return data ?? []
}

export default async function CodeLabPage() {
  const problems = await getProblems()
  return <ProblemsClient problems={problems} />
}
