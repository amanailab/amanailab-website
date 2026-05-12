export const revalidate = 3600

import type { Metadata } from 'next'
import Link from 'next/link'
import { BookOpen, ArrowRight, Layers, HelpCircle, Code2 } from 'lucide-react'
import { TOPICS } from '@/lib/topic-data'
import { getAdminSupabase } from '@/lib/admin'

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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOPICS.map((topic) => {
            const dbTopic   = TOPIC_DB_MAP[topic.slug]
            const qCount    = dbTopic ? (qCounts[dbTopic] ?? 0) : 0
            const codeCount = dbTopic ? (codeCounts[dbTopic] ?? 0) : 0
            return (
              <Link
                key={topic.slug}
                href={`/topics/${topic.slug}`}
                className="group bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-2xl p-5 flex flex-col gap-3 transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${topic.bg} ${topic.color}`}>
                    {topic.label}
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed line-clamp-3">{topic.description}</p>
                <div className="flex items-center gap-3 pt-2 border-t border-zinc-800 mt-auto flex-wrap">
                  <div className="flex items-center gap-1 text-[10px] text-zinc-600">
                    <BookOpen className="w-3 h-3" /> {topic.cards.length} flashcards
                  </div>
                  {qCount > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-zinc-600">
                      <HelpCircle className="w-3 h-3" /> {qCount} questions
                    </div>
                  )}
                  {codeCount > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-orange-400/70">
                      <Code2 className="w-3 h-3" /> {codeCount} problems
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
