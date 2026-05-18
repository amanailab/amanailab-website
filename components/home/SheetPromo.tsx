"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight, BookOpen, Code2, Layers, PenLine,
  HelpCircle, MessageCircle, Sparkles,
} from "lucide-react";

const TRACKS = [
  { icon: "✨", label: "Generative AI",    color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
  { icon: "🤖", label: "Agentic AI",       color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
  { icon: "🧠", label: "Deep Learning",    color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/20"    },
  { icon: "📊", label: "Machine Learning", color: "text-green-400",  bg: "bg-green-500/10 border-green-500/20"  },
  { icon: "⚙️", label: "MLOps",            color: "text-teal-400",   bg: "bg-teal-500/10 border-teal-500/20"    },
  { icon: "🏗️", label: "System Design",    color: "text-red-400",    bg: "bg-red-500/10 border-red-500/20"      },
  { icon: "🚀", label: "2026 Frontier",    color: "text-pink-400",   bg: "bg-pink-500/10 border-pink-500/20"    },
]

const FEATURES = [
  { icon: <BookOpen className="w-4 h-4" />,      color: "text-orange-400", label: "Inline theory",         desc: "Click any item to read the explanation — no navigation" },
  { icon: <Code2 className="w-4 h-4" />,         color: "text-green-400",  label: "Code Lab linked",       desc: "45+ coding problems open directly in the editor" },
  { icon: <Layers className="w-4 h-4" />,        color: "text-blue-400",   label: "Flashcards & Quiz",     desc: "Every topic links to targeted flashcard decks and MCQs" },
  { icon: <PenLine className="w-4 h-4" />,       color: "text-violet-400", label: "Design Workspace",      desc: "15 system design problems with AI review of your answer" },
]

export default function SheetPromo() {
  return (
    <section className="py-20 px-4 sm:px-6 bg-zinc-900/30">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-4 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            AI Interview Prep Sheet · 2026
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-100 mb-3">
            The A‑to‑Z AI/ML Interview Roadmap
          </h2>
          <p className="text-zinc-400 text-base max-w-2xl mx-auto">
            Inspired by Striver&apos;s A2Z DSA Sheet — built for 2026 AI/ML interviews.
            231 topics across 7 tracks with theory, code, flashcards, and system design all linked.
          </p>
        </motion.div>

        {/* Tracks */}
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-10">
          {TRACKS.map((t, i) => (
            <motion.div
              key={t.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.06 }}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border ${t.bg} text-center`}
            >
              <span className="text-xl leading-none">{t.icon}</span>
              <span className={`text-[10px] font-semibold leading-tight hidden sm:block ${t.color}`}>{t.label}</span>
            </motion.div>
          ))}
        </div>

        {/* Features row + CTA */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 + i * 0.07 }}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-start gap-3"
            >
              <span className={`mt-0.5 flex-shrink-0 ${f.color}`}>{f.icon}</span>
              <div>
                <p className="text-sm font-semibold text-zinc-200 mb-0.5">{f.label}</p>
                <p className="text-xs text-zinc-500 leading-snug">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA + Resource icons */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4 text-[11px] text-zinc-600 flex-wrap justify-center">
            <span className="font-medium text-zinc-500">Each item links to:</span>
            {[
              { icon: <BookOpen size={11} />, label: "Theory"    },
              { icon: <Code2 size={11} />,    label: "Code Lab"  },
              { icon: <Layers size={11} />,   label: "Flashcards"},
              { icon: <HelpCircle size={11}/>, label: "Quiz"     },
              { icon: <MessageCircle size={11}/>, label: "Interview"},
              { icon: <PenLine size={11} />,  label: "Design"   },
            ].map(({ icon, label }) => (
              <span key={label} className="flex items-center gap-1 text-zinc-500">{icon} {label}</span>
            ))}
          </div>

          <Link
            href="/sheet"
            className="flex-shrink-0 inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-semibold px-6 py-3 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-orange-500/20 text-sm whitespace-nowrap"
          >
            Start the Sheet
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

      </div>
    </section>
  )
}
