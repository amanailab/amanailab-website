export const revalidate = 3600

import type { Metadata } from 'next'
import { Layers } from 'lucide-react'
import { TOPICS } from '@/lib/topic-data'
import { getAdminSupabase } from '@/lib/admin'
import TopicsGrid from './TopicsGrid'

export const metadata: Metadata = {
  title: 'AI/ML Interview Topics — Complete Preparation Guides',
  description: 'Topic-by-topic AI/ML interview preparation guides. LLM, RAG, Agents, Fine-Tuning, MLOps, System Design and more — with real questions and model answers.',
  alternates: { canonical: 'https://amanailab.com/topics' },
}

const TOPIC_DB_MAP: Record<string, string> = {
  llm: 'LLM', rag: 'RAG', agents: 'Agents', 'fine-tuning': 'Fine-Tuning',
  mlops: 'MLOps', transformers: 'Transformers', 'system-design': 'System Design',
  python: 'Python', 'vector-db': 'Vector DB', nlp: 'NLP', statistics: 'Statistics',
}

async function getQuestionCounts(): Promise<Record<string, number>> {
  try {
    const supabase = getAdminSupabase()
    const { data } = await supabase
      .from('interview_questions')
      .select('topic')
    const counts: Record<string, number> = {}
    ;(data ?? []).forEach((r: { topic: string }) => {
      counts[r.topic] = (counts[r.topic] ?? 0) + 1
    })
    return counts
  } catch { return {} }
}

async function getCodeLabCounts(): Promise<Record<string, number>> {
  try {
    const supabase = getAdminSupabase()
    const { data } = await supabase.from('code_problems').select('topic')
    const counts: Record<string, number> = {}
    ;(data ?? []).forEach((r: { topic: string }) => {
      counts[r.topic] = (counts[r.topic] ?? 0) + 1
    })
    return counts
  } catch { return {} }
}

export default async function TopicsPage() {
  const [qCounts, codeCounts] = await Promise.all([getQuestionCounts(), getCodeLabCounts()])

  const topicsWithCounts = TOPICS.map(t => {
    const dbTopic = TOPIC_DB_MAP[t.slug]
    return {
      ...t,
      qCount:    dbTopic ? (qCounts[dbTopic] ?? 0)    : 0,
      codeCount: dbTopic ? (codeCounts[dbTopic] ?? 0) : 0,
    }
  })

  return (
    <div className="min-h-screen bg-zinc-950 pt-20 pb-16">
      <div className="max-w-5xl mx-auto px-4">

        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-1.5 mb-4">
            <Layers className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-xs font-semibold text-orange-400 uppercase tracking-wide">Interview Topics</span>
          </div>
          <h1 className="text-4xl font-extrabold text-zinc-100 mb-3">
            Master Every AI/ML Topic
          </h1>
          <p className="text-zinc-400 text-base max-w-xl mx-auto">
            Deep-dive guides for every topic asked in AI/ML interviews. Real questions, key concepts, and model answers.
          </p>
        </div>

        <TopicsGrid topics={topicsWithCounts} />
      </div>
    </div>
  )
}
