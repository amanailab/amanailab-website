import Link from 'next/link'
import { Building2 } from 'lucide-react'

interface Props {
  topicMap: Record<string, number[]>
}

const COMPANIES = [
  { name: 'OpenAI',       slug: 'openai',       topics: ['LLM','Transformers','Fine-Tuning','Agents','RAG'],                  color: '#10b981', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  { name: 'Anthropic',    slug: 'anthropic',     topics: ['LLM','Agents','Fine-Tuning','RAG','Behavioral'],                   color: '#f97316', bg: 'bg-orange-500/10 border-orange-500/20'  },
  { name: 'Google',       slug: 'google',        topics: ['LLM','System Design','Python','Statistics','Transformers'],         color: '#3b82f6', bg: 'bg-blue-500/10 border-blue-500/20'      },
  { name: 'Meta',         slug: 'meta',          topics: ['LLM','System Design','Computer Vision','NLP','Python'],             color: '#60a5fa', bg: 'bg-blue-400/10 border-blue-400/20'      },
  { name: 'Microsoft',    slug: 'microsoft',     topics: ['System Design','MLOps','Python','NLP','LLM'],                      color: '#6366f1', bg: 'bg-indigo-500/10 border-indigo-500/20'  },
  { name: 'Amazon',       slug: 'amazon',        topics: ['MLOps','System Design','Python','SQL & Data','Behavioral'],         color: '#f59e0b', bg: 'bg-amber-500/10 border-amber-500/20'    },
  { name: 'Nvidia',       slug: 'nvidia',        topics: ['Computer Vision','Transformers','MLOps','Python','Statistics'],     color: '#84cc16', bg: 'bg-lime-500/10 border-lime-500/20'      },
  { name: 'Hugging Face', slug: 'hugging-face',  topics: ['Fine-Tuning','Transformers','NLP','RAG','Python'],                  color: '#facc15', bg: 'bg-yellow-500/10 border-yellow-500/20'  },
]

function computeReadiness(topics: string[], topicMap: Record<string, number[]>): number {
  let total = 0
  for (const t of topics) {
    const scores = topicMap[t]
    if (scores && scores.length > 0) {
      total += (scores.reduce((a, b) => a + b, 0) / scores.length) / 10
    }
  }
  return Math.min(Math.round((total / topics.length) * 100), 100)
}

export default function CompanyReadiness({ topicMap }: Props) {
  const results = COMPANIES
    .map(c => ({ ...c, readiness: computeReadiness(c.topics, topicMap) }))
    .sort((a, b) => b.readiness - a.readiness)

  const best = results[0]

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-zinc-400" />
          <p className="text-sm font-bold text-zinc-100">Company Readiness</p>
        </div>
        {best && best.readiness > 0 && (
          <span className="text-xs text-zinc-500">
            Best match: <span className="text-orange-400 font-semibold">{best.name}</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {results.map(c => (
          <Link key={c.slug} href={`/companies/${c.slug}`}
            className="group flex items-center gap-3 bg-zinc-800/40 hover:bg-zinc-800/70 border border-zinc-700/40 hover:border-zinc-600 rounded-xl p-3 transition-all">
            <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 text-[10px] font-extrabold ${c.bg}`}
              style={{ color: c.color }}>
              {c.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors truncate">{c.name}</span>
                <span className="text-xs font-extrabold ml-2 shrink-0" style={{ color: c.readiness >= 70 ? '#4ade80' : c.readiness >= 50 ? '#facc15' : '#f87171' }}>
                  {c.readiness}%
                </span>
              </div>
              <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${c.readiness}%`, backgroundColor: c.color, opacity: 0.8 }} />
              </div>
              <p className="text-[9px] text-zinc-600 mt-1 truncate">
                {c.topics.slice(0, 3).join(' · ')}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {Object.keys(topicMap).length === 0 && (
        <p className="text-xs text-zinc-600 text-center mt-2">Complete interview sessions to see your company match scores</p>
      )}
    </div>
  )
}
