import type { Metadata } from 'next'
import Link from 'next/link'
import { SYSTEM_DESIGN_PROBLEMS } from '@/lib/system-design-problems'
import { ArrowRight, PenLine, Building2, Clock } from 'lucide-react'

export const metadata: Metadata = {
  title: 'System Design Practice — 15 Real ML & LLM Problems | AmanAI Lab',
  description: 'Practice 15 real ML and LLM system design interview problems with a structured editor, must-cover checklist, FAANG interview framework, architecture component snippets, and AI review of your written answer. Free.',
  alternates: { canonical: 'https://amanailab.com/system-design' },
  openGraph: {
    title: 'System Design Practice — 15 ML & LLM Problems',
    description: 'Practice real system design questions: LLM Serving, RAG Systems, YouTube Recommendation, Fraud Detection. Structured editor + AI review.',
    url: 'https://amanailab.com/system-design',
  },
}

const DIFF_COLOR = {
  Hard:   'text-red-400 bg-red-500/10 border-red-500/25',
  Medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/25',
} as const

const CATEGORY_COLOR: Record<string, string> = {
  'LLM Infrastructure': 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  'ML Systems':         'text-blue-400 bg-blue-500/10 border-blue-500/20',
  'Classic Tech':       'text-green-400 bg-green-500/10 border-green-500/20',
}

export default function SystemDesignPage() {
  const byCategory = SYSTEM_DESIGN_PROBLEMS.reduce<Record<string, typeof SYSTEM_DESIGN_PROBLEMS>>((acc, p) => {
    const cat = p.category
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(p)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-zinc-950 pt-20 pb-20">
      <div className="max-w-4xl mx-auto px-4">

        {/* Hero */}
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold mb-4 uppercase tracking-wide">
            <PenLine size={12} /> Practice Workspace
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-zinc-100 mb-3 tracking-tight">
            System Design Practice
          </h1>
          <p className="text-zinc-400 text-base max-w-2xl mx-auto">
            15 real ML &amp; LLM system design problems — each with a structured editor, FAANG interview framework, architecture component snippets, 45-minute timer, and AI review of your answer.
          </p>
        </div>

        {/* How it works strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          {[
            { icon: '📝', title: 'Write your design', desc: 'Markdown editor with template' },
            { icon: '✅', title: 'Check key areas', desc: 'Interactive must-cover checklist' },
            { icon: '📐', title: 'Use framework', desc: '5-step FAANG interview guide' },
            { icon: '🤖', title: 'Get AI review', desc: 'Scores 5 sections with feedback' },
          ].map(f => (
            <div key={f.title} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
              <div className="text-2xl mb-1.5">{f.icon}</div>
              <p className="text-xs font-semibold text-zinc-200 mb-0.5">{f.title}</p>
              <p className="text-[10px] text-zinc-500">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Problems by category */}
        <div className="space-y-8">
          {Object.entries(byCategory).map(([category, problems]) => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-4">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${CATEGORY_COLOR[category] ?? 'text-zinc-400 bg-zinc-800 border-zinc-700'}`}>
                  {category}
                </span>
                <span className="text-xs text-zinc-600">{problems.length} problems</span>
              </div>

              <div className="space-y-2">
                {problems.map((problem, idx) => (
                  <Link
                    key={problem.slug}
                    href={`/system-design/${problem.slug}`}
                    className="group flex items-center gap-4 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl px-4 py-3.5 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20"
                  >
                    {/* Number */}
                    <span className="text-sm font-mono text-zinc-700 w-5 flex-shrink-0">{idx + 1}</span>

                    {/* Title */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors truncate">
                        {problem.title}
                      </p>
                      {/* Company tags */}
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {problem.companies.slice(0, 4).map(c => (
                          <span key={c} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 border border-zinc-700">
                            {c === 'Microsoft' ? 'MSFT' : c === 'Anthropic' ? 'Anth' : c}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Difficulty */}
                    <span className={`hidden sm:inline text-xs font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${DIFF_COLOR[problem.difficulty] ?? ''}`}>
                      {problem.difficulty}
                    </span>

                    {/* Arrow */}
                    <ArrowRight size={15} className="text-zinc-600 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-8">
          <p className="text-zinc-400 text-sm mb-4">
            These problems are also linked directly from the{' '}
            <Link href="/sheet" className="text-orange-400 hover:text-orange-300 font-medium">Interview Prep Sheet</Link>
            {' '}— expand any System Design item to open its workspace.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap text-xs text-zinc-600">
            <span className="flex items-center gap-1"><Clock size={11} /> 45-min interview timer</span>
            <span className="flex items-center gap-1"><Building2 size={11} /> Company tags per problem</span>
            <span className="flex items-center gap-1"><PenLine size={11} /> Auto-saves to your browser</span>
          </div>
        </div>
      </div>
    </div>
  )
}
