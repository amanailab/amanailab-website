'use client'

import Link from 'next/link'
import { ArrowRight, CheckCircle2, BookOpen, Code2, Layers, HelpCircle, MessageCircle } from 'lucide-react'

const TRACKS = [
  { icon: '✨', label: 'Generative AI',   color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
  { icon: '🤖', label: 'Agentic AI',      color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
  { icon: '🧠', label: 'Deep Learning',   color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20' },
  { icon: '📊', label: 'Machine Learning',color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20' },
  { icon: '⚙️', label: 'MLOps',           color: 'text-teal-400',   bg: 'bg-teal-500/10 border-teal-500/20' },
  { icon: '🏗️', label: 'System Design',   color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20' },
]

const FEATURES = [
  { icon: <BookOpen size={15} />, text: 'Inline theory for every concept — no page navigation needed' },
  { icon: <Code2 size={15} />,    text: '45+ code problems that open directly in the Code Lab editor' },
  { icon: <Layers size={15} />,   text: 'Flashcard decks and topic quizzes linked per item' },
  { icon: <MessageCircle size={15} />, text: 'Mock interview and Q&A previews for every topic' },
]

const SAMPLE_ITEMS = [
  { title: 'Self-Attention Mechanism (Q, K, V)',  track: '✨ Gen AI',   diff: 'Medium', companies: ['G','OAI','M'] },
  { title: 'LoRA — Low-Rank Adaptation',          track: '✨ Gen AI',   diff: 'Hard',   companies: ['M','MS','G'] },
  { title: 'LangGraph — State Machine Agents',    track: '🤖 Agentic',  diff: 'Hard',   companies: ['AMZ','G','MS'] },
  { title: 'Backpropagation (Chain Rule)',         track: '🧠 DL',       diff: 'Hard',   companies: ['G','M','AMZ'] },
  { title: 'Bias-Variance Tradeoff',              track: '📊 ML',       diff: 'Medium', companies: ['G','M','AMZ','N'] },
  { title: 'Design RAG System End-to-End',        track: '🏗️ SD',       diff: 'Hard',   companies: ['MS','AMZ','G'] },
]

const DIFF_COLOR: Record<string, string> = {
  Easy: 'text-emerald-400', Medium: 'text-yellow-400', Hard: 'text-red-400',
}

export default function SheetPromo() {
  return (
    <section className="py-16 sm:py-20 bg-zinc-950 border-t border-zinc-800/60">
      <div className="max-w-6xl mx-auto px-4">

        {/* Header */}
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold mb-4">
            🗂️ NEW — 2026 Edition
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-100 mb-3 tracking-tight">
            AI Interview Prep Sheet
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto text-sm sm:text-base">
            The only structured AI/ML roadmap inspired by Striver&apos;s A2Z — but built for 2026 AI/ML interviews.
            Complete it and walk into any interview ready.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">

          {/* Left — tracks + features */}
          <div>
            {/* Tracks */}
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">6 Complete Tracks</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-7">
              {TRACKS.map(t => (
                <div key={t.label} className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium ${t.bg} ${t.color}`}>
                  <span>{t.icon}</span>
                  <span className="truncate">{t.label}</span>
                </div>
              ))}
            </div>

            {/* Features */}
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">Everything Linked</p>
            <div className="space-y-2.5 mb-8">
              {FEATURES.map(({ icon, text }) => (
                <div key={text} className="flex items-start gap-3">
                  <span className="text-orange-400 mt-0.5 flex-shrink-0">{icon}</span>
                  <span className="text-sm text-zinc-300">{text}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <Link
              href="/sheet"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-semibold px-6 py-3 rounded-xl transition-all hover:scale-105 shadow-lg shadow-orange-500/20"
            >
              Start the Sheet
              <ArrowRight size={16} />
            </Link>
            <p className="text-xs text-zinc-600 mt-2">Free · Progress saved automatically · No login required</p>
          </div>

          {/* Right — sample items preview */}
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">Sample Topics</p>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-[24px_1fr_auto] gap-3 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-600 border-b border-zinc-800 bg-zinc-950/50">
                <span />
                <span>Topic</span>
                <span>Level</span>
              </div>
              {SAMPLE_ITEMS.map((item, i) => (
                <div key={item.title}
                  className={`grid grid-cols-[24px_1fr_auto] gap-3 px-4 py-3 items-center ${i < SAMPLE_ITEMS.length - 1 ? 'border-b border-zinc-800/60' : ''}`}>
                  {/* Fake checkbox */}
                  <div className={`w-[18px] h-[18px] rounded border flex items-center justify-center flex-shrink-0 ${i < 2 ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-700'}`}>
                    {i < 2 && <CheckCircle2 size={11} className="text-white" />}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${i < 2 ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>{item.title}</p>
                    <p className={`text-[10px] mt-0.5 ${i < 2 ? 'text-zinc-600' : 'text-zinc-500'}`}>{item.track}</p>
                  </div>
                  <span className={`text-[11px] font-bold flex-shrink-0 ${DIFF_COLOR[item.diff]}`}>{item.diff}</span>
                </div>
              ))}
              {/* Footer */}
              <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-950/40 text-center">
                <Link href="/sheet" className="text-xs text-orange-400 hover:text-orange-300 font-medium transition-colors">
                  View all topics →
                </Link>
              </div>
            </div>

            {/* Resource icons legend */}
            <div className="flex items-center gap-4 mt-3 text-[11px] text-zinc-600 flex-wrap">
              {[
                { icon: <BookOpen size={12} />, label: 'Theory' },
                { icon: <Code2 size={12} />,    label: 'Code Lab' },
                { icon: <Layers size={12} />,   label: 'Flashcards' },
                { icon: <HelpCircle size={12} />, label: 'Quiz' },
                { icon: <MessageCircle size={12} />, label: 'Interview' },
              ].map(({ icon, label }) => (
                <span key={label} className="flex items-center gap-1">{icon} {label}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
