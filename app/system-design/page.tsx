import type { Metadata } from 'next'
import Link from 'next/link'
import { SYSTEM_DESIGN_PROBLEMS } from '@/lib/system-design-problems'
import { SITE_STATS } from '@/lib/site-stats'
import { PenLine, Clock, Building2, Sparkles, ListChecks, Cpu } from 'lucide-react'
import SystemDesignClient, { type SDItem } from './SystemDesignClient'

export const metadata: Metadata = {
  title: `System Design Practice — ${SITE_STATS.systemDesignProblems} Real ML & LLM Problems | AmanAI Lab`,
  description: `Practice ${SITE_STATS.systemDesignProblems} real ML and LLM system design interview problems with a structured editor, must-cover checklist, FAANG interview framework, architecture component snippets, and AI review of your written answer. Free.`,
  alternates: { canonical: 'https://amanailab.com/system-design' },
  openGraph: {
    title: `System Design Practice — ${SITE_STATS.systemDesignProblems} ML & LLM Problems`,
    description: 'Practice real system design questions: LLM Serving, RAG Systems, YouTube Recommendation, Fraud Detection. Structured editor + AI review.',
    url: 'https://amanailab.com/system-design',
  },
}

const HOW = [
  { icon: <PenLine size={16} />,    title: 'Write your design',  desc: 'Markdown editor + 45-min interview timer', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  { icon: <ListChecks size={16} />, title: 'Check key areas',    desc: 'Interactive must-cover checklist',         color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  { icon: <Cpu size={16} />,        title: 'Drop in components', desc: '12 ready architecture snippets',           color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
  { icon: <Sparkles size={16} />,   title: 'Get AI review',      desc: 'Scores 5 sections + interviewer note',     color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
]

export default function SystemDesignPage() {
  const items: SDItem[] = SYSTEM_DESIGN_PROBLEMS.map(p => ({
    slug: p.slug, title: p.title, difficulty: p.difficulty, companies: p.companies, category: p.category,
  }))

  return (
    <div className="min-h-screen bg-zinc-950 pt-20 pb-20">
      <div className="max-w-4xl mx-auto px-4">

        {/* ── Hero ──────────────────────────────────────────────────── */}
        <div className="relative text-center mb-10">
          <div className="absolute left-1/2 -translate-x-1/2 -top-10 w-[420px] h-[220px] rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(ellipse, rgba(139,92,246,0.18) 0%, transparent 70%)', filter: 'blur(40px)' }} aria-hidden />
          <div className="relative">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold mb-4 uppercase tracking-wide">
              <PenLine size={12} /> Practice Workspace
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-zinc-100 mb-3 tracking-tight">
              System Design Practice
            </h1>
            <p className="text-zinc-400 text-base max-w-2xl mx-auto">
              {SITE_STATS.systemDesignProblems} real ML &amp; LLM system design problems — each with a structured editor, FAANG framework, architecture snippets, a 45-minute timer, and AI review of your answer.
            </p>
          </div>
        </div>

        {/* ── How it works ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {HOW.map((f, i) => (
            <div key={f.title} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-2">
              <div className={`w-9 h-9 rounded-lg border flex items-center justify-center ${f.color}`}>{f.icon}</div>
              <div>
                <p className="text-xs font-semibold text-zinc-200 leading-tight">
                  <span className="text-zinc-600 mr-1">{i + 1}.</span>{f.title}
                </p>
                <p className="text-[10px] text-zinc-500 mt-0.5 leading-snug">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Interactive list (stats, filters, progress) ───────────── */}
        <SystemDesignClient problems={items} />

        {/* ── CTA ───────────────────────────────────────────────────── */}
        <div className="mt-12 text-center bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-8">
          <p className="text-zinc-400 text-sm mb-4">
            These problems are also linked from the{' '}
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
