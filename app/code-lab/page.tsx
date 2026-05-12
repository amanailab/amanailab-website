import type { Metadata } from 'next'
import { getAdminSupabase } from '@/lib/admin'
import ProblemsClient from './ProblemsClient'

export const metadata: Metadata = {
  title: 'AI/ML Code Lab',
  description: '20+ AI/ML coding problems — implement softmax, attention, RAG, KNN and more from scratch. Code-first AI/ML judge with XP levels and AI hints.',
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

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'AI/ML Code Lab',
  applicationCategory: 'EducationalApplication',
  description: '20+ AI/ML coding problems — implement algorithms from scratch, earn XP levels, unlock AI hints. Free judge for AI engineers.',
  url: 'https://amanailab.com/code-lab',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  operatingSystem: 'Web Browser',
}

export default async function CodeLabPage() {
  const problems = await getProblems()
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProblemsClient problems={problems} />
    </>
  )
}
