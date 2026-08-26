import type { Metadata } from 'next'
import Link from 'next/link'
import { SYSTEM_DESIGN_PROBLEMS } from '@/lib/system-design-problems'
import { SITE_STATS } from '@/lib/site-stats'
import { PenLine, Clock, Building2, Sparkles, ListChecks, Cpu, LogIn } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import SystemDesignClient, { type SDItem } from './SystemDesignClient'

export const metadata: Metadata = {
  title: `ML System Design Interview Practice — ${SITE_STATS.systemDesignProblems} Real Problems + AI Review | AmanAI Lab`,
  description: `Practice ${SITE_STATS.systemDesignProblems} real ML & LLM system design interview problems — LLM serving, RAG pipelines, recommendation systems, fraud detection. Structured editor, must-cover checklist, FAANG framework, and AI review that scores 5 sections with an interviewer perspective.`,
  alternates: { canonical: 'https://amanailab.com/system-design' },
  keywords: ['ML system design interview', 'LLM system design', 'RAG system design', 'machine learning system design', 'AI system design interview', 'FAANG ML interview', 'system design practice'],
  openGraph: {
    title: `ML System Design Interview Practice — ${SITE_STATS.systemDesignProblems} Real Problems`,
    description: 'Practice real ML system design: LLM Serving, RAG Systems, YouTube Recommendation, Fraud Detection. Structured editor + AI review that scores your answer.',
    url: 'https://amanailab.com/system-design',
    images: [{ url: '/api/og/tool?name=System+Design+Practice&tagline=Real+ML+%26+LLM+design+problems+%2B+AI+review&emoji=%F0%9F%93%90&tool=system-design', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ML System Design Interview Practice — Real Problems + AI Review',
    description: `${SITE_STATS.systemDesignProblems} real ML design problems with structured editor, checklist, and AI scoring. Free account required.`,
  },
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: 'What ML system design topics are covered?', acceptedAnswer: { '@type': 'Answer', text: 'LLM serving at scale, RAG pipeline design, recommendation systems, fraud detection, search systems, real-time ML pipelines, computer vision systems, and more. All problems are based on real FAANG interview questions.' } },
    { '@type': 'Question', name: 'How does the AI review work for system design?', acceptedAnswer: { '@type': 'Answer', text: 'Write your design in the markdown editor, then click "Get AI Review". The AI grades 5 sections: problem framing, architecture, scalability, ML specifics, and trade-offs. You get a score, letter grade, specific strengths, gaps to fix, and an interviewer perspective note.' } },
    { '@type': 'Question', name: 'How many free AI system design reviews do I get?', acceptedAnswer: { '@type': 'Answer', text: 'Every account gets 2 free AI reviews to start. SD Pro (₹799/30 days) gives you 15 reviews per day. The editor, timer, checklist, and components are always free.' } },
    { '@type': 'Question', name: 'Is this suitable for FAANG-level system design interviews?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Problems are sourced from real ML engineer interviews at Google, Meta, Amazon, Microsoft, and OpenAI. The framework covers exactly the 5 areas interviewers evaluate.' } },
  ],
};

const HOW = [
  { icon: <PenLine size={16} />,    title: 'Write your design',  desc: 'Markdown editor + 45-min interview timer', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  { icon: <ListChecks size={16} />, title: 'Check key areas',    desc: 'Interactive must-cover checklist',         color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  { icon: <Cpu size={16} />,        title: 'Drop in components', desc: '12 ready architecture snippets',           color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
  { icon: <Sparkles size={16} />,   title: 'Get AI review',      desc: 'Scores 5 sections + interviewer note',     color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
]

export default async function SystemDesignPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const items: SDItem[] = SYSTEM_DESIGN_PROBLEMS.map(p => ({
    slug: p.slug, title: p.title, difficulty: p.difficulty, companies: p.companies, category: p.category,
  }))

  return (
    <div className="min-h-screen bg-zinc-950 pt-20 pb-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
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

        {/* ── Login notice for guests ───────────────────────────────── */}
        {!user && (
          <div className="flex items-center justify-between gap-4 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 mb-6">
            <div className="flex items-center gap-3 min-w-0">
              <LogIn size={15} className="text-orange-400 shrink-0" />
              <p className="text-sm text-zinc-400 truncate">
                <span className="text-zinc-200 font-semibold">Free account required</span> — sign up in 10 seconds to access the editor, save progress, and get AI reviews.
              </p>
            </div>
            <Link href="/login?next=/system-design"
              className="shrink-0 flex items-center gap-1.5 bg-orange-500 hover:bg-orange-400 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
              Sign in free
            </Link>
          </div>
        )}

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
            Expand any problem to open its workspace — structured editor, must-cover checklist, 45-minute timer and AI review.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap text-xs text-zinc-600">
            <span className="flex items-center gap-1"><Clock size={11} /> 45-min interview timer</span>
            <span className="flex items-center gap-1"><Building2 size={11} /> Company tags per problem</span>
            <span className="flex items-center gap-1"><PenLine size={11} /> Auto-saves to your browser</span>
          </div>
        </div>

        {/* ── Cross-tool suggestions ──────────────────────────────── */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { href: '/interview?tab=simulator', icon: <Sparkles size={13} className="text-violet-400" />, label: 'AI Mock Interview', desc: 'Practice verbal answers to the same topics' },
            { href: '/resume',                  icon: <PenLine size={13} className="text-orange-400" />,  label: 'Resume Analyzer',  desc: 'Make sure your resume matches the JD' },
            { href: '/questions',               icon: <ListChecks size={13} className="text-blue-400" />, label: 'Question Bank',    desc: '500+ ML questions with model answers' },
          ].map(({ href, icon, label, desc }) => (
            <Link key={label} href={href}
              className="group flex items-start gap-3 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl px-4 py-3.5 transition-all">
              <div className="mt-0.5 shrink-0">{icon}</div>
              <div>
                <p className="text-xs font-semibold text-zinc-300 group-hover:text-zinc-100 transition-colors">{label}</p>
                <p className="text-[11px] text-zinc-600 mt-0.5 leading-snug">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
