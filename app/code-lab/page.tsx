import type { Metadata } from 'next'
import { getAdminSupabase } from '@/lib/admin'
import { STATIC_PROBLEMS } from '@/lib/code-problems-static'
import ProblemsClient from './ProblemsClient'

export const metadata: Metadata = {
  title: 'Free AI/ML Code Lab — Python Coding Problems with XP Levels',
  description: 'Implement AI/ML algorithms from scratch: softmax, attention, RAG pipelines, KNN, and more. AI hints, test runner, XP progression system. 45+ coding problems. Free.',
  alternates: { canonical: 'https://amanailab.com/code-lab' },
  openGraph: {
    title: 'AI/ML Code Lab — Implement Algorithms from Scratch',
    description: 'Coding judge for AI/ML engineers. Implement attention, RAG, KNN, LoRA and more. AI hints, XP levels, company tags.',
  },
}

async function getProblems() {
  const sb = getAdminSupabase()
  const { data } = await sb
    .from('code_problems')
    .select('id, title, slug, difficulty, topic, tags, companies, order_index')
    .order('order_index', { ascending: true })
  if (data && data.length > 0) return data
  // Fall back to static problems when DB is empty
  return STATIC_PROBLEMS.map(p => ({
    id: p.slug,
    title: p.title,
    slug: p.slug,
    difficulty: p.difficulty,
    topic: p.topic,
    tags: p.tags,
    companies: p.companies,
    order_index: p.order_index,
  }))
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'AI/ML Code Lab',
  applicationCategory: 'EducationalApplication',
  description: '45+ AI/ML coding problems — implement algorithms from scratch, earn XP levels, unlock AI hints. Free judge for AI engineers.',
  url: 'https://amanailab.com/code-lab',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  operatingSystem: 'Web Browser',
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: 'Is the AI/ML Code Lab free?', acceptedAnswer: { '@type': 'Answer', text: 'Yes, all problems and features are completely free.' } },
    { '@type': 'Question', name: 'What AI/ML algorithms can I implement in Code Lab?', acceptedAnswer: { '@type': 'Answer', text: 'Problems include: softmax, attention mechanism, RAG pipeline, KNN, LSTM, word2vec, transformer encoder, fine-tuning with LoRA, vector similarity search, and more.' } },
    { '@type': 'Question', name: 'What programming language does Code Lab use?', acceptedAnswer: { '@type': 'Answer', text: 'Python 3.11, running directly in your browser via WebAssembly. No installation required.' } },
    { '@type': 'Question', name: 'What is the XP system in Code Lab?', acceptedAnswer: { '@type': 'Answer', text: 'You earn XP for solving problems (Easy=20, Medium=50, Hard=100 XP), with bonuses for speed and first solve. XP unlocks 6 levels from ML Beginner to AI Master.' } },
    { '@type': 'Question', name: 'Are there AI hints available for the problems?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. The AI Assist tab offers 5 modes: Debug (finds bugs without spoilers), Complexity analysis, Approach hints (Socratic), Code Review (after solving), and full Solution (after solving).' } },
  ],
}

export default async function CodeLabPage() {
  const problems = await getProblems()
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <ProblemsClient problems={problems} />
    </>
  )
}
